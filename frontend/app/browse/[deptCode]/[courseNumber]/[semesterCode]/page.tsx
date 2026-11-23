"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { TableRowsSkeleton, TextBlockSkeleton } from "@/components/feedback/Skeletons";
import OfferingDetailScreen from "@/components/course/OfferingDetailScreen";
import PageContainer from "@/components/layout/PageContainer";
import { api } from "@/lib/api";
import { courseHref, parsePositiveRouteInteger } from "@/lib/course-routes";
import { useCourseRouteResolution } from "@/hooks/useCourseRouteResolution";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import type { OfferingDetail } from "@/lib/types";

export default function CanonicalOfferingDetailPage() {
  const params = useParams<{ deptCode: string; courseNumber: string; semesterCode: string }>();
  const route = useCourseRouteResolution(params.deptCode, params.courseNumber);
  const semesterCode = useMemo(() => parsePositiveRouteInteger(params.semesterCode), [params.semesterCode]);
  const [detail, setDetail] = useState<{ routeKey: string; offering: OfferingDetail } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const { requestVersion, retry } = useRetryableRequest();
  const resolvedCourse = route.status === "resolved" ? route.course : null;
  const routeKey = resolvedCourse && semesterCode !== null
    ? `${resolvedCourse.deptId}/${resolvedCourse.courseId}/${semesterCode}`
    : null;
  const attemptKey = routeKey === null ? null : `${routeKey}#${requestVersion}`;

  useEffect(() => {
    let isActive = true;
    if (!resolvedCourse || semesterCode === null || routeKey === null || attemptKey === null) return;
    const courseToLoad = resolvedCourse;
    const semesterToLoad = semesterCode;
    const detailRouteKey = routeKey;
    const thisAttempt = attemptKey;

    async function loadOffering() {
      try {
        const offering = await api.getOfferingDetail(courseToLoad.deptId, courseToLoad.courseId, semesterToLoad);
        if (!isActive) return;
        setDetail({ routeKey: detailRouteKey, offering });
      } catch {
        if (!isActive) return;
        setFailedKey(thisAttempt);
      }
    }

    void loadOffering();
    return () => {
      isActive = false;
    };
  }, [resolvedCourse, routeKey, semesterCode, attemptKey]);

  if (route.status === "invalid" || semesterCode === null) {
    return <PageContainer><ErrorMessage title="Invalid offering link" message="This offering link is invalid." /></PageContainer>;
  }
  if (route.status === "notFound") {
    return <PageContainer><ErrorMessage title="Offering not found" message="This offering could not be found." /></PageContainer>;
  }
  if (route.status === "error") {
    return <PageContainer><ErrorMessage message="Failed to resolve this offering link." /></PageContainer>;
  }
  if (failedKey !== null && failedKey === attemptKey) {
    return (
      <PageContainer>
        <ErrorMessage title="Couldn't load this offering" message="Failed to load offering details." onRetry={retry} />
      </PageContainer>
    );
  }
  if (route.status !== "resolved" || !detail || detail.routeKey !== routeKey) {
    return (
      <PageContainer>
        <TextBlockSkeleton heading lines={2} label="Loading offering" className="mb-10" />
        <TableRowsSkeleton rows={4} columns={5} label="Loading sections" />
      </PageContainer>
    );
  }

  return <OfferingDetailScreen detail={detail.offering} backHref={courseHref(route.course.deptCode, route.course.courseNumber)} />;
}
