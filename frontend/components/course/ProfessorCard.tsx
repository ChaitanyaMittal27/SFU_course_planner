"use client";

import { useState } from "react";
import { Check, ExternalLink, Flag } from "lucide-react";
import { bodyStyles, headerStyles, labelStyles } from "@/app/fonts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RmpLookupState } from "@/hooks/useRmpLookups";
import type { RmpTeacher } from "@/lib/types";

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

function Stats({ teacher }: { teacher: RmpTeacher }) {
  const stats = [
    { label: "Rating", value: formatOutOfFive(teacher.avgRating) },
    { label: "Difficulty", value: formatOutOfFive(teacher.avgDifficulty) },
    { label: "Would take again", value: formatPercent(teacher.wouldTakeAgainPercent) },
    { label: "Ratings", value: teacher.numRatings === null ? "—" : String(teacher.numRatings) },
  ];
  return (
    <dl className="mt-3 grid grid-cols-2 gap-3">
      {stats.map(({ label, value }) => (
        <div key={label}>
          <dt className={`${bodyStyles.sm} text-text-subtle`}>{label}</dt>
          <dd className={`${headerStyles.md} text-text-primary`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatsSkeleton() {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12" />
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
      className={`${bodyStyles.md} inline-flex items-center gap-1 text-accent hover:underline`}
    >
      {children}
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

export default function ProfessorCard({ name, sections, state, onRetry, onReport }: ProfessorCardProps) {
  const [report, setReport] = useState<ReportState>("idle");
  const lookup = state.status === "loaded" ? state.lookup : null;
  const displayName = lookup?.searchName || name;
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

  return (
    <div className="border rounded-xl p-4 border-border/50" aria-busy={state.status === "loading"}>
      <div className={`${headerStyles.sm} text-text-primary`}>{displayName}</div>
      {sections.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {sections.map((section) => (
            <Badge key={section} variant="outline" className="text-text-muted">
              {section}
            </Badge>
          ))}
        </div>
      )}

      {state.status === "loading" && <StatsSkeleton />}

      {lookup?.status === "MATCHED" && lookup.teacher && <Stats teacher={lookup.teacher} />}

      {lookup?.status === "NO_MATCH" && (
        <p className={`mt-3 ${bodyStyles.md} text-text-muted`}>Not found on Rate My Professors.</p>
      )}

      {(state.status === "error" || lookup?.status === "UNAVAILABLE") && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className={`${bodyStyles.md} text-text-muted`}>Couldn&apos;t reach Rate My Professors.</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}

      {lookup && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {lookup.status === "MATCHED" && lookup.teacher?.profileUrl ? (
            <ExternalTextLink href={lookup.teacher.profileUrl}>View on Rate My Professors</ExternalTextLink>
          ) : (
            <ExternalTextLink href={lookup.searchUrl}>Search on Rate My Professors</ExternalTextLink>
          )}

          {canReport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReport}
              disabled={report === "reporting" || report === "reported"}
              className={`${labelStyles.md} text-text-muted`}
            >
              {report === "reported" ? (
                <>
                  <Check aria-hidden="true" /> Reported
                </>
              ) : (
                <>
                  <Flag aria-hidden="true" />
                  {report === "failed" ? "Couldn't report, try again" : "Report wrong match"}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
