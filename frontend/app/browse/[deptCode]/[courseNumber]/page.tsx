"use client";

import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/layout/BackButton";
import CourseOfferingsPanel from "@/components/course/CourseOfferingsPanel";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import { bodyStyles, displayStyles } from "@/app/fonts";
import { useCourseRouteResolution } from "@/hooks/useCourseRouteResolution";

export default function BrowseCoursePage() {
  const params = useParams<{ deptCode: string; courseNumber: string }>();
  const router = useRouter();
  const route = useCourseRouteResolution(params.deptCode, params.courseNumber);

  if (route.status === "invalid") {
    return <div className="max-w-[1180px] mx-auto px-4 sm:px-7 py-8 sm:py-10"><ErrorMessage message="This course link is invalid." /></div>;
  }

  if (route.status === "notFound") {
    return <div className="max-w-[1180px] mx-auto px-4 sm:px-7 py-8 sm:py-10"><ErrorMessage message="This course could not be found." /></div>;
  }

  if (route.status === "error") {
    return <div className="max-w-[1180px] mx-auto px-4 sm:px-7 py-8 sm:py-10"><ErrorMessage message="Failed to resolve this course link." /></div>;
  }

  if (route.status === "loading") return <LoadingSpinner />;

  const { course: resolvedCourse } = route;

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-7 py-8 sm:py-10">
      <BackButton onClick={() => router.push("/browse")} label="Back to Browse" className="mb-5" />
      <div className="mb-5 sm:mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary`}>Browse Courses</h1>
        <p className={`${bodyStyles.lg} text-text-muted mt-1`}>Course offerings and enrollment details.</p>
      </div>
      <CourseOfferingsPanel reference={resolvedCourse} department={resolvedCourse.department} course={resolvedCourse.course} />
    </div>
  );
}
