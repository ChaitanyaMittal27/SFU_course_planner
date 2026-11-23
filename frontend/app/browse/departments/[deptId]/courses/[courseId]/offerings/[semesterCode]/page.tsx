"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import PageContainer from "@/components/layout/PageContainer";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import { offeringHref, parseLegacyCourseRoute, parsePositiveRouteInteger } from "@/lib/course-routes";
import { resolveCourseIds } from "@/lib/course-resolver";

export default function OfferingDetailPage() {
  const router = useRouter();
  const params = useParams<{ deptId: string; courseId: string; semesterCode: string }>();
  const legacyRoute = useMemo(
    () => parseLegacyCourseRoute(params.deptId, params.courseId),
    [params.courseId, params.deptId],
  );
  const semesterCode = useMemo(() => parsePositiveRouteInteger(params.semesterCode), [params.semesterCode]);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const { requestVersion, retry } = useRetryableRequest();
  const canResolve = legacyRoute.status === "valid" && semesterCode !== null;

  useEffect(() => {
    if (!canResolve || legacyRoute.status !== "valid" || semesterCode === null) {
      return;
    }

    let active = true;
    void resolveCourseIds(legacyRoute.deptId, legacyRoute.courseId)
      .then((course) => {
        if (!active) return;
        if (!course) setError({ message: "This offering could not be found.", retryable: false });
        else router.replace(offeringHref(course.deptCode, course.courseNumber, semesterCode));
      })
      .catch(() => active && setError({ message: "Failed to resolve this offering link.", retryable: true }));
    return () => {
      active = false;
    };
  }, [canResolve, legacyRoute, router, semesterCode, requestVersion]);

  const retryResolution = () => {
    setError(null);
    retry();
  };

  if (!canResolve) {
    return (
      <PageContainer>
        <ErrorMessage message="This offering link is invalid." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorMessage message={error.message} onRetry={error.retryable ? retryResolution : undefined} />
      </PageContainer>
    );
  }

  return <PageSkeleton label="Opening this offering" />;
}
