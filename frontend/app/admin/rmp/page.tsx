"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ExternalLink, Flag, UserCheck, UserX } from "lucide-react";
import { api, ApiError, AdminRmpReport } from "@/lib/api";
import { parseRmpProfessorUrl } from "@/lib/instructors";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminPage, AdminPageHeader, AdminStatGrid, AdminTable } from "@/components/admin/AdminPage";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { bodyStyles, displayStyles, labelStyles } from "@/app/fonts";

type Action = "dismiss" | "no-match" | "professor";

const URL_HINT = "Enter a Rate My Professors professor link, like https://www.ratemyprofessors.com/professor/3030010";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** What to tell the admin when setting a professor fails. */
function setProfessorError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) return "No professor with that ID on Rate My Professors.";
    if (error.status === 400) return "That professor isn't at an SFU listing on Rate My Professors.";
    if (error.status === 503) return "Couldn't reach Rate My Professors. Try again.";
  }
  return "Couldn't set the professor. Try again.";
}

export default function AdminRmpReportsPage() {
  const [reports, setReports] = useState<AdminRmpReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getAdminRmpReports();
      setReports(data);
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, "Failed to load reports"));
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        const data = await api.getAdminRmpReports();
        if (active) {
          setError(null);
          setReports(data);
        }
      } catch (requestError: unknown) {
        if (active) setError(errorMessage(requestError, "Failed to load reports"));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReports();
    return () => { active = false; };
  }, []);

  // Every action resolves all of the lookup's reports, so the row leaves the list.
  const handleResolved = (lookupId: number) => {
    setReports((current) => current.filter((report) => report.lookupId !== lookupId));
    setExpandedId(null);
  };

  if (loading) {
    return <AdminPageSkeleton statCards={2} hasTable tableRows={6} />;
  }

  if (error && reports.length === 0) {
    return (
      <AdminPage>
        <ErrorMessage message={error} onRetry={fetchReports} />
      </AdminPage>
    );
  }

  const openReports = reports.reduce((total, report) => total + report.openReports, 0);
  const stats = [
    { label: "Instructors to review", value: reports.length },
    { label: "Open reports", value: openReports },
  ];

  return (
    <AdminPage>
      <AdminPageHeader
        title="RMP Reports"
        description="Professor cards that users reported as the wrong Rate My Professors match. Every action resolves all open reports for that instructor."
      />

      <AdminStatGrid columns={2}>
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <CardContent className="p-0">
              <p className={`${labelStyles.md} mb-2 text-text-muted`}>{stat.label}</p>
              <span className={`${displayStyles.sm} font-mono tracking-tight text-text-primary`}>{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </AdminStatGrid>

      {reports.length === 0 ? (
        <Card className="p-8">
          <CardContent className="p-0 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-surface-raised">
              <Flag className="size-8 text-text-subtle" />
            </div>
            <p className={`${bodyStyles.md} text-text-muted`}>No open reports</p>
          </CardContent>
        </Card>
      ) : (
        <AdminTable>
          <ul>
            {reports.map((report) => (
              <ReportRow
                key={report.lookupId}
                report={report}
                isExpanded={expandedId === report.lookupId}
                onToggle={() => setExpandedId((current) => (current === report.lookupId ? null : report.lookupId))}
                onResolved={() => handleResolved(report.lookupId)}
              />
            ))}
          </ul>
        </AdminTable>
      )}
    </AdminPage>
  );
}

function ReportRow({
  report,
  isExpanded,
  onToggle,
  onResolved,
}: {
  report: AdminRmpReport;
  isExpanded: boolean;
  onToggle: () => void;
  onResolved: () => void;
}) {
  const [pending, setPending] = useState<Action | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const matched = report.status === "MATCHED";
  const panelId = `rmp-report-${report.lookupId}`;

  const run = async (action: Action, request: () => Promise<unknown>, onError: (error: unknown) => void) => {
    setPending(action);
    setActionError(null);
    setUrlError(null);
    try {
      await request();
      onResolved();
    } catch (requestError) {
      onError(requestError);
      setPending(null);
    }
  };

  const actionFailed = () => setActionError("Couldn't update this report. Try again.");

  const handleSetProfessor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const legacyId = parseRmpProfessorUrl(url);
    if (legacyId === null) {
      setUrlError(URL_HINT);
      return;
    }
    run("professor", () => api.setRmpProfessor(report.lookupId, legacyId), (requestError) =>
      setUrlError(setProfessorError(requestError)),
    );
  };

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-[18px] py-3 text-left transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0 flex-1 basis-48">
          <span className={`${labelStyles.lg} block truncate font-medium text-text-primary`}>{report.displayName}</span>
          <span className={`${bodyStyles.sm} block truncate text-text-subtle`}>
            {report.rawName} · {report.deptCode.toUpperCase()}
          </span>
        </div>

        <div className="flex flex-none items-center gap-2">
          {matched ? (
            <Badge variant="outline" className="font-mono text-text-muted">RMP #{report.rmpLegacyId}</Badge>
          ) : (
            <Badge variant="outline" className="text-text-muted">No match</Badge>
          )}
          {matched && (
            <span className={`${labelStyles.sm} font-mono text-text-subtle`}>
              {report.matchScore === null ? "No score" : `Score ${report.matchScore.toFixed(2)}`}
            </span>
          )}
        </div>

        <div className="flex flex-none items-center gap-2">
          <Badge className="border-transparent bg-warning/15 text-warning">
            {report.openReports} {report.openReports === 1 ? "report" : "reports"}
          </Badge>
          <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{formatDate(report.lastReportedAt)}</span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 text-text-subtle transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {isExpanded && (
        <div id={panelId} className="animate-fade-in space-y-3 px-[18px] pt-1 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {report.profileUrl ? (
              <a
                href={report.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ExternalLink aria-hidden="true" /> Open link
              </a>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ExternalLink aria-hidden="true" /> No link
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={pending !== null}
              onClick={() => run("no-match", () => api.setRmpNoMatch(report.lookupId), actionFailed)}
            >
              <UserX aria-hidden="true" /> {pending === "no-match" ? "Saving..." : "No match"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending !== null}
              onClick={() => run("dismiss", () => api.dismissRmpReports(report.lookupId), actionFailed)}
            >
              <Check aria-hidden="true" /> {pending === "dismiss" ? "Saving..." : "Match is correct"}
            </Button>
          </div>
          {actionError && <p className={`${bodyStyles.sm} text-destructive`} role="alert">{actionError}</p>}

          <form onSubmit={handleSetProfessor} noValidate>
            <label htmlFor={`${panelId}-url`} className={`${labelStyles.md} mb-1.5 block text-text-muted`}>
              Correct professor&apos;s RMP link
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id={`${panelId}-url`}
                type="url"
                inputMode="url"
                placeholder="https://www.ratemyprofessors.com/professor/3030010"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setUrlError(null);
                }}
                aria-invalid={urlError !== null}
                aria-describedby={urlError ? `${panelId}-url-error` : undefined}
                disabled={pending !== null}
              />
              <Button type="submit" size="sm" className="h-8 flex-none" disabled={pending !== null || url.trim() === ""}>
                <UserCheck aria-hidden="true" /> {pending === "professor" ? "Setting..." : "Set professor"}
              </Button>
            </div>
            {urlError && (
              <p id={`${panelId}-url-error`} className={`${bodyStyles.sm} mt-1.5 text-destructive`} role="alert">
                {urlError}
              </p>
            )}
          </form>
        </div>
      )}
    </li>
  );
}
