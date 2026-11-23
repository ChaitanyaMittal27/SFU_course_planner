"use client";

import { useId, useMemo } from "react";
import { bodyStyles, headerStyles } from "@/app/fonts";
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
  /**
   * "card": one "Instructors" card with a row per professor (offering page).
   * "grid": a heading plus a grid of standalone professor cards (Compare sections).
   */
  variant?: "card" | "grid";
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
 * RateMyProfessors ratings for every unique instructor across the given sections.
 * Ratings load automatically, a few at a time, and fill in per professor.
 */
export default function InstructorRatings({ sections, deptCode, variant = "grid", className }: InstructorRatingsProps) {
  const instructors = useMemo(() => groupSectionsByInstructor(sections), [sections]);
  const names = useMemo(() => instructors.map((instructor) => instructor.name), [instructors]);
  const { lookups, retry } = useRmpLookups(names, deptCode);
  const headingId = useId();

  const professors = (layout: "card" | "row") =>
    instructors.map((instructor) => (
      <ProfessorCard
        key={instructor.name}
        layout={layout}
        name={instructorDisplayName(instructor.name)}
        sections={instructor.sections}
        state={lookups[instructor.name]}
        onRetry={() => retry(instructor.name)}
        onReport={(lookupId) => api.reportRmpMismatch(lookupId)}
      />
    ));

  const notAnnounced = <p className={cn(bodyStyles.md, "text-text-muted")}>Instructors not announced yet.</p>;

  if (variant === "card") {
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
          notAnnounced
        ) : (
          <div className={cn(cardPadding, "divide-y divide-border py-0 sm:py-0")}>{professors("row")}</div>
        )}
      </SectionCard>
    );
  }

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className={cn(headerStyles.lg, "mb-3 text-text-primary")}>
        Instructors
      </h2>
      {instructors.length === 0 ? (
        notAnnounced
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{professors("card")}</div>
          <p className={cn(bodyStyles.sm, "mt-2 text-text-subtle")}>
            Ratings from <RmpLink />
          </p>
        </>
      )}
    </section>
  );
}
