"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CompareHeader from "@/components/compare/CompareHeader";
import SectionCoursePicker from "@/components/compare/SectionCoursePicker";
import SectionComparisonResults from "@/components/course/SectionComparisonResults";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { TextBlockSkeleton } from "@/components/feedback/Skeletons";
import PageContainer from "@/components/layout/PageContainer";
import { parsePositiveRouteInteger, sectionComparisonHref } from "@/lib/course-routes";
import { useCourseRouteResolution } from "@/hooks/useCourseRouteResolution";

export default function CanonicalSectionComparisonPage() {
  const params = useParams<{ deptCode: string; courseNumber: string; semesterCode: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const route = useCourseRouteResolution(params.deptCode, params.courseNumber);
  const semesterCode = useMemo(() => parsePositiveRouteInteger(params.semesterCode), [params.semesterCode]);
  const requestedSections = useMemo(() => (searchParams.get("sections") ?? "").split(",").filter(Boolean), [searchParams]);

  const body = (() => {
    if (route.status === "invalid" || semesterCode === null) {
      return <ErrorMessage title="Invalid comparison link" message="This section comparison link is invalid." />;
    }
    if (route.status === "notFound") return <ErrorMessage title="Course not found" message="This course could not be found." />;
    if (route.status === "error") return <ErrorMessage message="Failed to resolve this course link." onRetry={route.retry} />;
    if (route.status === "loading") return <TextBlockSkeleton lines={3} label="Loading course" />;

    const { course } = route;
    return (
      <>
        <SectionCoursePicker
          key={`picker-${course.courseId}-${semesterCode}`}
          initial={{ deptId: course.deptId, courseId: course.courseId, semesterCode }}
        />
        <SectionComparisonResults
          key={`${course.courseId}-${semesterCode}`}
          course={course}
          semesterCode={semesterCode}
          requestedSections={requestedSections}
          onSectionsChange={(sections) => router.replace(sectionComparisonHref(course.deptCode, course.courseNumber, semesterCode, sections))}
        />
      </>
    );
  })();

  return (
    <PageContainer>
      <CompareHeader tab="sections" />
      {body}
    </PageContainer>
  );
}
