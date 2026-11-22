"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
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
  const [error, setError] = useState<string | null>(null);
  const canResolve = legacyRoute.status === "valid" && semesterCode !== null;

  useEffect(() => {
    if (!canResolve || legacyRoute.status !== "valid" || semesterCode === null) {
      return;
    }

    void resolveCourseIds(legacyRoute.deptId, legacyRoute.courseId)
      .then((course) => {
        if (!course) setError("This offering could not be found.");
        else router.replace(offeringHref(course.deptCode, course.courseNumber, semesterCode));
      })
      .catch(() => setError("Failed to resolve this offering link."));
  }, [canResolve, legacyRoute, router, semesterCode]);

  if (!canResolve) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ErrorMessage message="This offering link is invalid." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return <LoadingSpinner />;
}
