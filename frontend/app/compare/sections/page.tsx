"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import CompareHeader from "@/components/compare/CompareHeader";
import SectionCoursePicker from "@/components/compare/SectionCoursePicker";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { parseLegacyCourseRoute, parsePositiveRouteInteger, sectionCode, sectionComparisonHref } from "@/lib/course-routes";
import { resolveCourseIds } from "@/lib/course-resolver";

type LegacySectionComparisonLink =
  | { status: "none" | "invalid" }
  | { status: "valid"; departmentId: number; courseId: number; semesterCode: number };

function parseLegacySectionComparisonLink(searchParams: Pick<URLSearchParams, "get">): LegacySectionComparisonLink {
  const departmentIdParam = searchParams.get("deptId");
  const courseIdParam = searchParams.get("courseId");
  const semesterCodeParam = searchParams.get("semester");

  if (![departmentIdParam, courseIdParam, semesterCodeParam].some(Boolean)) return { status: "none" };

  const legacyCourseRoute = parseLegacyCourseRoute(departmentIdParam, courseIdParam);
  const semesterCode = parsePositiveRouteInteger(semesterCodeParam);
  if (legacyCourseRoute.status !== "valid" || semesterCode === null) return { status: "invalid" };

  return { status: "valid", departmentId: legacyCourseRoute.deptId, courseId: legacyCourseRoute.courseId, semesterCode };
}

function SectionComparisonStart() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyLink = useMemo(() => parseLegacySectionComparisonLink(searchParams), [searchParams]);
  const [legacyFailed, setLegacyFailed] = useState(false);

  // Old numeric links (?deptId=&courseId=&semester=&sections=) resolve once and redirect.
  useEffect(() => {
    if (legacyLink.status !== "valid") return;
    let active = true;
    void resolveCourseIds(legacyLink.departmentId, legacyLink.courseId)
      .then((course) => {
        if (!active) return;
        if (!course) {
          setLegacyFailed(true);
          return;
        }
        const sections = (searchParams.get("sections") ?? "").split(",").map(sectionCode).filter(Boolean);
        router.replace(sectionComparisonHref(course.deptCode, course.courseNumber, legacyLink.semesterCode, sections));
      })
      .catch(() => active && setLegacyFailed(true));
    return () => {
      active = false;
    };
  }, [legacyLink, router, searchParams]);

  const invalidLink = legacyLink.status === "invalid" || legacyFailed;

  return (
    <PageContainer>
      <CompareHeader tab="sections" />
      <SectionCoursePicker />
      {invalidLink ? (
        <ErrorMessage title="Invalid comparison link" message="This section comparison link is invalid." />
      ) : (
        <TaskEmptyState
          icon={ClipboardList}
          title="Choose a course and term."
          description="Then pick the sections you're choosing between."
        />
      )}
    </PageContainer>
  );
}

export default function SectionComparisonPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SectionComparisonStart />
    </Suspense>
  );
}
