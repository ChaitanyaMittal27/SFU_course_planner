"use client";

import { useParams } from "next/navigation";
import CourseBreadcrumb from "@/components/course/CourseBreadcrumb";
import CourseOfferingsPanel from "@/components/course/CourseOfferingsPanel";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { TextBlockSkeleton } from "@/components/feedback/Skeletons";
import PageContainer from "@/components/layout/PageContainer";
import { useCourseRouteResolution } from "@/hooks/useCourseRouteResolution";
import { formatCourseCode } from "@/lib/course-stats";

export default function BrowseCoursePage() {
  const params = useParams<{ deptCode: string; courseNumber: string }>();
  const route = useCourseRouteResolution(params.deptCode, params.courseNumber);
  const code = formatCourseCode(params.deptCode ?? "", params.courseNumber ?? "");

  return (
    <PageContainer>
      <CourseBreadcrumb items={[{ label: "Browse", href: "/browse" }, { label: code }]} />
      {route.status === "invalid" && <ErrorMessage title="Invalid course link" message="This course link is invalid." />}
      {route.status === "notFound" && <ErrorMessage title="Course not found" message="This course could not be found." />}
      {route.status === "error" && <ErrorMessage message="Failed to resolve this course link." />}
      {route.status === "loading" && <TextBlockSkeleton heading lines={2} label="Loading course" />}
      {route.status === "resolved" && (
        <CourseOfferingsPanel reference={route.course} department={route.course.department} course={route.course.course} />
      )}
    </PageContainer>
  );
}
