"use client";

import { useMemo } from "react";
import { bodyStyles } from "@/app/fonts";
import ProfessorCard from "@/components/course/ProfessorCard";
import SectionCard, { cardPadding } from "@/components/course/SectionCard";
import { useRmpLookups } from "@/hooks/useRmpLookups";
import { api } from "@/lib/api";
import { groupSectionsByInstructor, instructorDisplayName } from "@/lib/instructors";
import type { CourseOffering } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InstructorRatingsProps {
  /** Sections whose instructors to show; one entry per unique instructor. */
  sections: CourseOffering[];
  /** Course department code, e.g. "cmpt" (used to match the right professor). */
  deptCode: string;
  className?: string;
}

function RmpLink() {
  return (
    <a href="https://www.ratemyprofessors.com" target="_blank" rel="noopener noreferrer" className="text-accent-text hover:underline">
      RateMyProfessors
    </a>
  );
}

/**
 * RateMyProfessors ratings for every unique instructor across the given sections:
 * one "Instructors" card with a row per professor (offering page).
 * Ratings load automatically, a few at a time, and fill in per professor.
 */
export default function InstructorRatings({ sections, deptCode, className }: InstructorRatingsProps) {
  const instructors = useMemo(() => groupSectionsByInstructor(sections), [sections]);
  const names = useMemo(() => instructors.map((instructor) => instructor.name), [instructors]);
  const { lookups, retry } = useRmpLookups(names, deptCode);

  return (
    <SectionCard
      title="Instructors"
      note={
        instructors.length > 0 ? (
          <>
            Ratings from <RmpLink />
          </>
        ) : undefined
      }
      flush={instructors.length > 0}
      className={className}
    >
      {instructors.length === 0 ? (
        <p className={cn(bodyStyles.md, "text-text-muted")}>Instructors not announced yet.</p>
      ) : (
        <div className={cn(cardPadding, "divide-y divide-border py-0 sm:py-0")}>
          {instructors.map((instructor) => (
            <ProfessorCard
              key={instructor.name}
              name={instructorDisplayName(instructor.name)}
              sections={instructor.sections}
              state={lookups[instructor.name]}
              onRetry={() => retry(instructor.name)}
              onReport={(lookupId) => api.reportRmpMismatch(lookupId)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
