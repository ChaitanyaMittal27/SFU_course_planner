"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { bodyStyles, headerStyles, numericStyles } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RmpLookupState } from "@/hooks/useRmpLookups";
import type { RmpTeacher } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProfessorCardProps {
  /** Display name shown until the lookup returns its own. */
  name: string;
  /** Short section codes this instructor teaches, e.g. ["D100", "D200"]. */
  sections: string[];
  state: RmpLookupState;
  onRetry: () => void;
  onReport: (lookupId: number) => Promise<unknown>;
}

type ReportState = "idle" | "reporting" | "reported" | "failed";

function formatOutOfFive(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)} / 5`;
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}%`;
}

function OverallRating({ value, loading }: { value: number | null; loading: boolean }) {
  if (loading) return <Skeleton aria-hidden="true" className="h-9 w-16" />;
  return (
    <p className="flex flex-col gap-1">
      <span className={cn(numericStyles.display, value === null ? "text-text-subtle" : "text-text-primary")}>
        {value === null ? "—" : value.toFixed(1)}
      </span>
      <span className={cn(bodyStyles.sm, "text-text-muted")}>/ 5 overall</span>
    </p>
  );
}

function RatingDetails({ teacher }: { teacher: RmpTeacher }) {
  const details = [
    { label: "Difficulty", value: formatOutOfFive(teacher.avgDifficulty) },
    { label: "Would take again", value: formatPercent(teacher.wouldTakeAgainPercent) },
    { label: "Number of ratings", value: teacher.numRatings === null ? "—" : String(teacher.numRatings) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {details.map(({ label, value }) => (
        <div key={label} className="flex flex-col-reverse gap-0.5">
          <dt className={cn(bodyStyles.sm, "text-text-subtle")}>{label}</dt>
          <dd className={cn(numericStyles.md, "whitespace-nowrap text-text-primary")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function ExternalTextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(bodyStyles.md, "inline-flex items-center gap-1 text-accent-text hover:underline")}
    >
      {children}
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

const reportLabels: Record<ReportState, string> = {
  idle: "Wrong professor?",
  reporting: "Reporting…",
  reported: "Reported, thanks",
  failed: "Couldn't report, try again",
};

/** One professor as a borderless row inside the Instructors card, rating on the left. */
export default function ProfessorCard({ name, sections, state, onRetry, onReport }: ProfessorCardProps) {
  const [report, setReport] = useState<ReportState>("idle");
  const lookup = state.status === "loaded" ? state.lookup : null;
  const displayName = lookup?.searchName || name;
  const loading = state.status === "loading";
  const failed = state.status === "error" || lookup?.status === "UNAVAILABLE";
  const teacher = lookup?.status === "MATCHED" ? lookup.teacher : null;
  const canReport = lookup !== null && lookup.status !== "UNAVAILABLE" && lookup.lookupId !== null;

  const handleReport = async () => {
    if (!lookup || lookup.lookupId === null) return;
    // Open the search first, inside the click, so the browser does not block the new tab.
    window.open(lookup.searchUrl, "_blank", "noopener,noreferrer");
    setReport("reporting");
    try {
      await onReport(lookup.lookupId);
      setReport("reported");
    } catch {
      setReport("failed");
    }
  };

  const identity = (
    <div>
      <h3 className={cn(headerStyles.sm, "text-text-primary")}>{displayName}</h3>
      {sections.length > 0 && (
        <p className={cn(bodyStyles.sm, "mt-0.5 text-text-muted")}>
          Teaches <span className={numericStyles.base}>{sections.join(", ")}</span>
        </p>
      )}
    </div>
  );

  const body = (
    <>
      {loading && <DetailsSkeleton />}
      {teacher && <RatingDetails teacher={teacher} />}

      {lookup?.status === "NO_MATCH" && <p className={cn(bodyStyles.md, "text-text-muted")}>Not found on RateMyProfessors.</p>}

      {failed && (
        <div className="flex flex-wrap items-center gap-3">
          <p className={cn(bodyStyles.md, "text-text-muted")}>Couldn&apos;t reach RateMyProfessors.</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}

      {lookup && !failed && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {teacher?.profileUrl ? (
            <ExternalTextLink href={teacher.profileUrl}>View on RateMyProfessors</ExternalTextLink>
          ) : (
            <ExternalTextLink href={lookup.searchUrl}>Search on RateMyProfessors</ExternalTextLink>
          )}

          {canReport && (
            <button
              type="button"
              onClick={handleReport}
              disabled={report === "reporting" || report === "reported"}
              className={cn(
                bodyStyles.sm,
                "rounded-sm text-text-muted underline-offset-4 hover:text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:no-underline disabled:hover:text-text-muted"
              )}
            >
              {reportLabels[report]}
            </button>
          )}
        </div>
      )}
    </>
  );

  // The overall rating always shows ("—" without a match).
  return (
    <article aria-busy={loading} aria-label={displayName} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 py-4">
      <OverallRating value={teacher?.avgRating ?? null} loading={loading} />
      <div className="space-y-3">
        {identity}
        {body}
      </div>
    </article>
  );
}
