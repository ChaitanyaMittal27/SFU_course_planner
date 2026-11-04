"use client";

import { useMemo } from "react";
import { bodyStyles, headerStyles } from "@/app/fonts";
import ProfessorCard from "@/components/course/ProfessorCard";
import { useRmpLookups } from "@/hooks/useRmpLookups";
import { api } from "@/lib/api";
import { groupSectionsByInstructor, instructorDisplayName } from "@/lib/instructors";
import type { CourseOffering } from "@/lib/types";

interface InstructorRatingsProps {
  /** Sections whose instructors to show; one card per unique instructor. */
  sections: CourseOffering[];
  /** Course department code, e.g. "cmpt" (used to match the right professor). */
  deptCode: string;
}

/**
 * "Instructors" section: one Rate My Professors card per unique instructor across the
 * given sections. Ratings load automatically, a few at a time, and fill in per card.
 */
export default function InstructorRatings({ sections, deptCode }: InstructorRatingsProps) {
  const instructors = useMemo(() => groupSectionsByInstructor(sections), [sections]);
  const names = useMemo(() => instructors.map((instructor) => instructor.name), [instructors]);
  const { lookups, retry } = useRmpLookups(names, deptCode);

  return (
    <section aria-label="Instructors">
      <div className={`${headerStyles.md} text-text-primary mb-3`}>Instructors</div>

      {instructors.length === 0 ? (
        <p className={`${bodyStyles.md} text-text-muted`}>Instructors not announced yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <p className={`mt-2 ${bodyStyles.sm} text-text-subtle`}>
            Ratings from{" "}
            <a
              href="https://www.ratemyprofessors.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Rate My Professors
            </a>
            .
          </p>
        </>
      )}
    </section>
  );
}
