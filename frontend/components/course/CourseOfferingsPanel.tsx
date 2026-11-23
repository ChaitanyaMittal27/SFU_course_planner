"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarX } from "lucide-react";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { TableRowsSkeleton } from "@/components/feedback/Skeletons";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";
import OfferingsTable from "@/components/course/OfferingsTable";
import SectionCard from "@/components/course/SectionCard";
import SummaryRow from "@/components/course/SummaryRow";
import PageHeader from "@/components/layout/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { numericStyles } from "@/app/fonts";
import { api } from "@/lib/api";
import { graphCourseHref, offeringHref, serializeComparedCourses, type CourseRouteReference } from "@/lib/course-routes";
import { averageRecentLoad, campusesOf, formatCourseCode, formatPercent } from "@/lib/course-stats";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import type { Course, CourseOffering, Department, GradeDistribution, TermInfo } from "@/lib/types";

export const INITIAL_OFFERING_ROWS = 12;

interface CourseOfferingsPanelProps {
  reference: CourseRouteReference;
  department: Department;
  course: Course;
}

/** The course page body: header with actions, summary figures, and the offerings table. */
export default function CourseOfferingsPanel({ reference, department, course }: CourseOfferingsPanelProps) {
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [enrollingTerm, setEnrollingTerm] = useState<TermInfo | null>(null);
  const [grades, setGrades] = useState<GradeDistribution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { requestVersion, retry } = useRetryableRequest();

  useEffect(() => {
    let isActive = true;

    async function loadOfferings() {
      setError(null);
      setIsLoading(true);
      try {
        const [offeringData, term] = await Promise.all([
          api.getOfferings(reference.deptId, reference.courseId),
          api.getEnrollingTerm(),
        ]);
        if (!isActive) return;
        setOfferings([...offeringData].sort((a, b) => b.semesterCode - a.semesterCode));
        setEnrollingTerm(term);
      } catch {
        if (isActive) setError("Failed to load course offerings.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadOfferings();
    return () => {
      isActive = false;
    };
  }, [reference.courseId, reference.deptId, requestVersion]);

  // Grade figures are optional: on failure the summary simply omits them.
  useEffect(() => {
    let isActive = true;
    api
      .getGradeDistribution(reference.courseId)
      .then((data) => {
        if (isActive) setGrades(data);
      })
      .catch(() => {
        if (isActive) setGrades(null);
      });
    return () => {
      isActive = false;
    };
  }, [reference.courseId]);

  const code = formatCourseCode(department.deptCode, course.courseNumber);
  const campuses = campusesOf(offerings);
  const facts = [
    department.name,
    course.units ? `${course.units} units` : null,
    campuses.length > 0 ? campuses.join(", ") : null,
  ].filter(Boolean);
  const avgLoad = averageRecentLoad(offerings, enrollingTerm);
  const visible = showAll ? offerings : offerings.slice(0, INITIAL_OFFERING_ROWS);
  const hiddenCount = offerings.length - visible.length;
  const hasRows = !isLoading && !error && offerings.length > 0;
  const compareHref = `/compare/courses?courses=${serializeComparedCourses([reference])}`;

  return (
    <>
      <PageHeader
        title={
          <>
            <span className={numericStyles.base}>{code}</span>
            {course.title ? ` · ${course.title}` : ""}
          </>
        }
        description={facts.join(" · ")}
        actions={
          <>
            <Link href={compareHref} className={buttonVariants({ variant: "outline" })}>
              Compare
            </Link>
            <Link href={graphCourseHref("load", reference.deptCode, reference.courseNumber)} className={buttonVariants({ variant: "outline" })}>
              View trends
            </Link>
          </>
        }
      />

      <SummaryRow
        items={[
          { label: "Median grade", value: grades?.medianGrade || null },
          { label: "Fail rate", value: grades ? formatPercent(grades.failRate) : null },
          { label: "Avg. load, last 3 terms", value: avgLoad === null ? null : `${Math.floor(avgLoad)}%` },
        ]}
      />

      <SectionCard
        title="Offerings"
        note={hasRows ? `${visible.length} of ${offerings.length} sections` : undefined}
        flush={hasRows}
        footer={
          hasRows && hiddenCount > 0 ? (
            <Button variant="outline" onClick={() => setShowAll(true)}>
              Show older terms ({hiddenCount})
            </Button>
          ) : undefined
        }
      >
        {error && (
          <ErrorMessage
            className="rounded-none border-0 bg-transparent px-0 py-0"
            title="Couldn't load offerings"
            message={error}
            onRetry={retry}
          />
        )}
        {isLoading && !error && <TableRowsSkeleton rows={6} columns={5} label="Loading offerings" />}
        {!isLoading && !error && offerings.length === 0 && (
          <TaskEmptyState icon={CalendarX} title="No offerings found." description="SFU hasn't listed this course in any term we track." />
        )}
        {hasRows && (
          <OfferingsTable
            offerings={visible}
            enrollingTerm={enrollingTerm}
            offeringHref={(offering) => offeringHref(reference.deptCode, reference.courseNumber, offering.semesterCode)}
          />
        )}
      </SectionCard>
    </>
  );
}
