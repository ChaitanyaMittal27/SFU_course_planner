"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CanonicalAnalyticsPage, { type AnalyticsKind } from "@/components/analytics/CanonicalAnalyticsPage";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { ChartAreaSkeleton } from "@/components/feedback/Skeletons";
import PageContainer from "@/components/layout/PageContainer";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import { graphCourseHref, parseLegacyCourseRoute } from "@/lib/course-routes";
import { resolveCourseIds } from "@/lib/course-resolver";

/**
 * /graph/{kind} with the old ?deptId=&courseId=(&range=) query: resolve once and replace
 * the URL with the canonical /graph/{kind}/{DEPT}/{NUM} route (range kept for load and
 * enrollment, as before). Without a course in the query it renders the graphs page with
 * no course selected.
 */
function GraphQueryRedirectContent({ kind }: { kind: AnalyticsKind }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacy = useMemo(() => parseLegacyCourseRoute(searchParams.get("deptId"), searchParams.get("courseId")), [searchParams]);
  const range = searchParams.get("range");
  const [failure, setFailure] = useState<{ kind: "notFound" | "error"; requestVersion: number } | null>(null);
  const { requestVersion, retry } = useRetryableRequest();

  useEffect(() => {
    if (legacy.status !== "valid") return;
    let active = true;
    resolveCourseIds(legacy.deptId, legacy.courseId)
      .then((course) => {
        if (!active) return;
        if (!course) {
          setFailure({ kind: "notFound", requestVersion });
          return;
        }
        const options = kind !== "grades" && range ? { range } : undefined;
        router.replace(graphCourseHref(kind, course.deptCode, course.courseNumber, options));
      })
      .catch(() => active && setFailure({ kind: "error", requestVersion }));
    return () => {
      active = false;
    };
  }, [kind, legacy, range, router, requestVersion]);

  const currentFailure = failure?.requestVersion === requestVersion ? failure.kind : null;

  if (legacy.status === "none") return <CanonicalAnalyticsPage kind={kind} />;
  if (currentFailure === "error") {
    return (
      <PageContainer>
        <ErrorMessage title="Couldn't open this graph" message="Failed to resolve this analytics link." onRetry={retry} />
      </PageContainer>
    );
  }
  if (legacy.status === "invalid" || currentFailure === "notFound") {
    return (
      <PageContainer>
        <ErrorMessage title="Invalid graph link" message="This analytics link is invalid." />
      </PageContainer>
    );
  }
  return (
    <PageContainer>
      <ChartAreaSkeleton label="Opening graph" />
    </PageContainer>
  );
}

export default function GraphQueryRedirect({ kind }: { kind: AnalyticsKind }) {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <ChartAreaSkeleton />
        </PageContainer>
      }
    >
      <GraphQueryRedirectContent kind={kind} />
    </Suspense>
  );
}
