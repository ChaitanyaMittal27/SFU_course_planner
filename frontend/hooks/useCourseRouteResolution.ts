"use client";

import { useEffect, useMemo, useState } from "react";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import { normalizeCourseIdentity } from "@/lib/course-routes";
import { resolveCourseIdentity, type ResolvedCourseRoute } from "@/lib/course-resolver";

export type CourseRouteResolution =
  | { status: "invalid" }
  | { status: "loading" }
  | { status: "notFound" }
  | { status: "error" }
  | { status: "resolved"; course: ResolvedCourseRoute };

type ResolutionResult = Exclude<CourseRouteResolution, { status: "invalid" } | { status: "loading" }> & {
  routeKey: string;
  requestVersion: number;
};

/**
 * Resolves a readable course URL exactly once per route identity.
 *
 * Pages should use this only for URL state. Their resource-specific data (for
 * example offerings or section results) remains local to the page.
 * `retry` re-runs a failed resolution (show it as the ErrorMessage "Try again").
 */
export function useCourseRouteResolution(
  deptCode: string | string[] | undefined,
  courseNumber: string | string[] | undefined,
): CourseRouteResolution & { retry: () => void } {
  const identity = useMemo(() => {
    if (typeof deptCode !== "string" || typeof courseNumber !== "string") return null;
    return normalizeCourseIdentity(deptCode, courseNumber);
  }, [courseNumber, deptCode]);
  const routeKey = identity ? `${identity.deptCode}/${identity.courseNumber}` : null;
  const [result, setResult] = useState<ResolutionResult | null>(null);
  const { requestVersion, retry } = useRetryableRequest();

  useEffect(() => {
    if (!identity || !routeKey) return;

    let active = true;
    void resolveCourseIdentity(identity)
      .then((course) => {
        if (!active) return;
        setResult(
          course
            ? { status: "resolved", course, routeKey, requestVersion }
            : { status: "notFound", routeKey, requestVersion },
        );
      })
      .catch(() => active && setResult({ status: "error", routeKey, requestVersion }));

    return () => {
      active = false;
    };
  }, [identity, routeKey, requestVersion]);

  if (!identity || !routeKey) return { status: "invalid", retry };
  if (!result || result.routeKey !== routeKey || result.requestVersion !== requestVersion) return { status: "loading", retry };
  if (result.status === "resolved") return { status: "resolved", course: result.course, retry };
  return { status: result.status, retry };
}
