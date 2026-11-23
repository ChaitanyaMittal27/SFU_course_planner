"use client";

import { seatLoadPercent } from "@/lib/enrollment-status";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import ComparisonTable, { type ComparisonRowData } from "@/components/compare/ComparisonTable";
import SectionCard from "@/components/course/SectionCard";
import LoadBar from "@/components/enrollment/LoadBar";
import StatusBadge from "@/components/enrollment/StatusBadge";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { TableRowsSkeleton } from "@/components/feedback/Skeletons";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import { useRmpLookups, type RmpLookupState } from "@/hooks/useRmpLookups";
import { api, type CourseOffering } from "@/lib/api";
import { offeringHref, sectionCode } from "@/lib/course-routes";
import type { ResolvedCourseRoute } from "@/lib/course-resolver";
import { formatCourseCode } from "@/lib/course-stats";
import { instructorDisplayName, splitInstructors } from "@/lib/instructors";
import { formatSemesterCode } from "@/lib/semester";
import { cn } from "@/lib/utils";

export const MAX_COMPARED_SECTIONS = 3;

type SectionComparisonResultsProps = {
  course: ResolvedCourseRoute;
  semesterCode: number;
  requestedSections: string[];
  onSectionsChange: (sections: string[]) => void;
};

function normalizeSelectedSections(sections: string[], availableSections: CourseOffering[]) {
  const availableCodes = new Set(availableSections.map((section) => sectionCode(section.section)));
  return [...new Set(sections.map(sectionCode).filter((code) => availableCodes.has(code)))].slice(0, MAX_COMPARED_SECTIONS);
}

function RatingCell({ names, lookups }: { names: string[]; lookups: Record<string, RmpLookupState> }) {
  if (names.length === 0) return <span className="text-text-subtle">—</span>;
  return (
    <ul className="space-y-1">
      {names.map((name) => {
        const state = lookups[name];
        const lookup = state?.status === "loaded" ? state.lookup : null;
        const rating = lookup?.status === "MATCHED" ? lookup.teacher?.avgRating ?? null : null;
        return (
          <li key={name}>
            {names.length > 1 && <span className={cn(bodyStyles.sm, "block text-text-muted")}>{instructorDisplayName(name)}</span>}
            {!state || state.status === "loading" ? (
              <Skeleton aria-label="Loading rating" className="h-4 w-12" />
            ) : rating !== null ? (
              <span className={numericStyles.md}>
                {rating.toFixed(1)} <span className={cn(bodyStyles.sm, "text-text-muted")}>/ 5</span>
              </span>
            ) : lookup?.status === "MATCHED" ? (
              <span className="text-text-subtle">— / 5 · {lookup.teacher?.numRatings ?? 0} ratings</span>
            ) : lookup?.status === "NO_MATCH" ? (
              <span className="text-text-subtle">No match</span>
            ) : (
              <span className="text-text-subtle">Unavailable</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function SectionComparisonResults({ course, semesterCode, requestedSections, onSectionsChange }: SectionComparisonResultsProps) {
  const { requestVersion, retry } = useRetryableRequest();
  const [result, setResult] = useState<{ attempt: number; sections: CourseOffering[] | null } | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const attempt = requestVersion;
    api
      .getOfferingDetail(course.deptId, course.courseId, semesterCode)
      .then((offering) => active && setResult({ attempt, sections: offering.sections }))
      .catch(() => active && setResult({ attempt, sections: null }));
    return () => {
      active = false;
    };
  }, [course.courseId, course.deptId, semesterCode, requestVersion]);

  const settled = result?.attempt === requestVersion ? result : null;
  const availableSections = useMemo(() => settled?.sections ?? [], [settled]);
  const selectedSections = useMemo(
    () => normalizeSelectedSections(requestedSections, availableSections),
    [requestedSections, availableSections],
  );
  const comparisonSections = useMemo(
    () => availableSections.filter((section) => selectedSections.includes(sectionCode(section.section))),
    [availableSections, selectedSections],
  );

  const comparing = comparisonSections.length >= 2;
  const instructorNames = useMemo(
    () => (comparing ? [...new Set(comparisonSections.flatMap((section) => splitInstructors(section.instructors)))] : []),
    [comparing, comparisonSections],
  );
  const { lookups } = useRmpLookups(instructorNames, course.deptCode);

  const code = formatCourseCode(course.deptCode, course.courseNumber);
  const termLabel = formatSemesterCode(semesterCode);

  if (!settled) return <TableRowsSkeleton rows={4} columns={3} label="Loading sections" />;
  if (settled.sections === null) {
    return <ErrorMessage title="Couldn't load sections" message={`${code} sections for ${termLabel} didn't load. It may not be offered that term.`} onRetry={retry} />;
  }
  if (availableSections.length === 0) {
    return <TaskEmptyState headingLevel={2} icon={ClipboardList} title={`No sections of ${code} in ${termLabel}.`} description="Pick another term to compare." />;
  }
  if (availableSections.length === 1) {
    return (
      <TaskEmptyState
        headingLevel={2}
        icon={ClipboardList}
        title={`Only one section of ${code} in ${termLabel}. Pick another term to compare.`}
        description="There is nothing to compare it with in this term."
      />
    );
  }

  const handleChange = (values: string[]) => {
    if (values.length > MAX_COMPARED_SECTIONS) {
      setLimitMessage(`You can compare up to ${MAX_COMPARED_SECTIONS} sections at a time.`);
      return;
    }
    setLimitMessage(null);
    onSectionsChange(values);
  };

  const rows: ComparisonRowData[] = [
    {
      label: "Instructor",
      cells: comparisonSections.map((section) => {
        const names = splitInstructors(section.instructors);
        return names.length > 0 ? names.map(instructorDisplayName).join(", ") : "—";
      }),
    },
    {
      label: "RMP rating",
      cells: comparisonSections.map((section) => <RatingCell key={section.section} names={splitInstructors(section.instructors)} lookups={lookups} />),
    },
    { label: "Campus", cells: comparisonSections.map((section) => section.location || "—") },
    {
      label: "Enrolled / cap",
      cells: comparisonSections.map((section) => (
        <span key={section.section} className={numericStyles.md}>
          {section.enrolled} / {section.capacity}
        </span>
      )),
    },
    {
      label: "Load",
      cells: comparisonSections.map((section) => (
        <div key={section.section} className="flex flex-wrap items-center gap-2">
          <LoadBar percent={seatLoadPercent(section)} />
          <StatusBadge loadPercent={seatLoadPercent(section)} />
        </div>
      )),
    },
    {
      label: "Details",
      cells: comparisonSections.map((section) => (
        <Link
          key={section.section}
          href={offeringHref(course.deptCode, course.courseNumber, semesterCode)}
          aria-label={`View offering for ${sectionCode(section.section)}`}
          className={cn(bodyStyles.sm, "inline-flex items-center gap-0.5 text-accent-text hover:underline")}
        >
          View offering
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </Link>
      )),
    },
  ];

  return (
    <>
      <fieldset className="mb-8">
        <legend className={cn(labelStyles.lg, "mb-2 text-text-primary")}>Sections</legend>
        <ToggleGroup
          multiple
          value={selectedSections}
          onValueChange={(values) => handleChange(values as string[])}
          spacing={2}
          className="w-full flex-wrap"
          aria-label={`Sections of ${code} in ${termLabel}`}
        >
          {availableSections.map((section) => {
            const short = sectionCode(section.section);
            return (
              <ToggleGroupItem
                key={section.section}
                value={short}
                variant="outline"
                className="h-auto flex-col items-start gap-0 px-3 py-1.5 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                <span className={cn(numericStyles.md, "font-semibold")}>{short}</span>
                <span className={cn(bodyStyles.sm, "font-normal opacity-80")}>{section.location || "Campus TBA"}</span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
        <p role="status" className={cn(bodyStyles.sm, "mt-2 min-h-5 text-warning-text")}>
          {limitMessage}
        </p>
      </fieldset>

      {comparing ? (
        <SectionCard title={`${code} · ${termLabel}`} note={`${comparisonSections.length} sections selected`} flush>
          <ComparisonTable
            columns={comparisonSections.map((section) => ({
              key: section.section,
              mobileLabel: sectionCode(section.section),
              header: <span className={cn(numericStyles.md, "font-semibold")}>{sectionCode(section.section)}</span>,
            }))}
            rows={rows}
          />
        </SectionCard>
      ) : (
        <TaskEmptyState headingLevel={2} icon={ClipboardList} title="Select at least two sections to compare." description={`Pick up to ${MAX_COMPARED_SECTIONS} sections above.`} />
      )}
    </>
  );
}
