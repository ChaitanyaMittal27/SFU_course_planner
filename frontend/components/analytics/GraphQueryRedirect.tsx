"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CanonicalAnalyticsPage, { type AnalyticsKind } from "@/components/analytics/CanonicalAnalyticsPage";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { ChartAreaSkeleton } from "@/components/feedback/Skeletons";
import PageContainer from "@/components/layout/PageContainer";
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (legacy.status !== "valid") return;
    let active = true;
    resolveCourseIds(legacy.deptId, legacy.courseId)
      .then((course) => {
        if (!active) return;
        if (!course) {
          setFailed(true);
          return;
        }
        const options = kind !== "grades" && range ? { range } : undefined;
        router.replace(graphCourseHref(kind, course.deptCode, course.courseNumber, options));
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [kind, legacy, range, router]);

  if (legacy.status === "none") return <CanonicalAnalyticsPage kind={kind} />;
  if (legacy.status === "invalid" || failed) {
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
    <Suspense fallback={null}>
      <GraphQueryRedirectContent kind={kind} />
    </Suspense>
  );
}
