"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Pencil, X, Check } from "lucide-react";
import { api, AdminTerm } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorMessage from "@/components/ErrorMessage";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

const TERM_OPTIONS = ["spring", "summer", "fall"] as const;
const TERM_DIGIT: Record<string, number> = { spring: 1, summer: 4, fall: 7 };

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function semesterCode(year: number, term: string): number {
  return (year - 1900) * 10 + (TERM_DIGIT[term] ?? 0);
}

export default function AdminTermsPage() {
  const [terms, setTerms] = useState<AdminTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState("");
  const [currentTerm, setCurrentTerm] = useState("spring");
  const [enrollingYear, setEnrollingYear] = useState("");
  const [enrollingTerm, setEnrollingTerm] = useState("summer");
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchTerms = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getAdminTerms();
      setTerms(data);

      const cur = data.find((t) => t.isCurrent);
      const enr = data.find((t) => t.isEnrolling);
      if (cur) {
        setCurrentYear(String(cur.year));
        setCurrentTerm(cur.term);
      }
      if (enr) {
        setEnrollingYear(String(enr.year));
        setEnrollingTerm(enr.term);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load terms";
      setError(message);
    }
  }, []);

  useEffect(() => {
    fetchTerms().finally(() => setLoading(false));
  }, [fetchTerms]);

  const handleSubmit = async () => {
    setFormError(null);

    const cy = parseInt(currentYear, 10);
    const ey = parseInt(enrollingYear, 10);

    if (!currentYear || !enrollingYear || isNaN(cy) || isNaN(ey)) {
      setFormError("Both year fields are required");
      return;
    }

    if (cy === ey && currentTerm === enrollingTerm) {
      setFormError("Current and enrolling cannot be the same term");
      return;
    }

    if (semesterCode(ey, enrollingTerm) <= semesterCode(cy, currentTerm)) {
      setFormError("Enrolling term must be chronologically after current term");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api.updateTerms({
        currentYear: cy,
        currentTerm: currentTerm,
        enrollingYear: ey,
        enrollingTerm: enrollingTerm,
      });
      setTerms(updated);
      setFormOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update terms";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openForm = () => {
    setFormError(null);
    setSaved(false);
    setFormOpen(true);
  };

  const enrollingTermObj = terms.find((t) => t.isEnrolling);
  const currentTermObj = terms.find((t) => t.isCurrent);
  const currentCode = currentTermObj ? semesterCode(currentTermObj.year, currentTermObj.term) : 0;

  if (loading) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <div className="mb-6">
          <Skeleton className="h-8 w-52 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-2 gap-3.5 mb-7">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error && terms.length === 0) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <ErrorMessage message={error} onRetry={fetchTerms} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 max-w-[1180px]">
      {/* Heading */}
      <div className="mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary mb-1`}>Terms management</h1>
        <p className={`${bodyStyles.md} text-text-muted`}>
          Control which academic term is active and open for enrollment.
        </p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-7">
        <Card className="p-4 border-success/20">
          <CardContent className="p-0">
            <div className={`${labelStyles.sm} uppercase tracking-widest text-text-subtle mb-2.5`}>Enrolling Term</div>
            <div className="flex items-center gap-3">
              <span className="font-display font-semibold text-[20px] tracking-tight text-text-primary">
                {enrollingTermObj ? `${capitalize(enrollingTermObj.term)} ${enrollingTermObj.year}` : "Not set"}
              </span>
              {enrollingTermObj && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-success/15 text-success">
                  <span className="w-[5px] h-[5px] rounded-full bg-current" />
                  Enrolling
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 border-accent/20">
          <CardContent className="p-0">
            <div className={`${labelStyles.sm} uppercase tracking-widest text-text-subtle mb-2.5`}>Current Term</div>
            <span className="font-display font-semibold text-[20px] tracking-tight text-text-primary">
              {currentTermObj ? `${capitalize(currentTermObj.term)} ${currentTermObj.year}` : "Not set"}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Table toolbar */}
      <div className="flex items-center justify-between mb-3">
        <h2 className={`${headerStyles.xs} text-text-primary`}>All terms</h2>
        <div className="flex items-center gap-2.5">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-success animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          <Button variant="outline" onClick={() => (formOpen ? setFormOpen(false) : openForm())} className="gap-2">
            <Pencil className="w-3.5 h-3.5" />
            {formOpen ? "Cancel" : "Update Terms"}
          </Button>
        </div>
      </div>

      {/* Terms table */}
      <Card className="overflow-hidden mb-3.5">
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-[1fr_108px_120px_1fr] px-[18px] py-2.5 bg-surface-raised border-b border-border">
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>Term</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>
              Is Enrolling
            </span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>
              Is Current
            </span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-right`}>
              Updated At
            </span>
          </div>
          {/* Rows */}
          {terms.map((t, i) => {
            const code = semesterCode(t.year, t.term);
            const isPast = currentCode > 0 && code < currentCode;
            return (
              <div
                key={t.termId}
                className={`grid grid-cols-[1fr_108px_120px_1fr] px-[18px] py-3 items-center hover:bg-surface-raised transition-colors ${
                  i < terms.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar
                    className={`w-3.5 h-3.5 flex-none ${isPast ? "text-text-subtle" : "text-text-muted"}`}
                  />
                  <span
                    className={`${labelStyles.lg} ${isPast ? "text-text-muted font-normal" : "text-text-primary font-medium"}`}
                  >
                    {capitalize(t.term)} {t.year}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  {t.isEnrolling ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success">
                      <span className="w-[5px] h-[5px] rounded-full bg-current" />
                      Enrolling
                    </span>
                  ) : (
                    <span className="text-text-subtle text-[16px]">—</span>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  {t.isCurrent ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success">
                      <span className="w-[5px] h-[5px] rounded-full bg-current" />
                      Active
                    </span>
                  ) : (
                    <span className="text-text-subtle text-[16px]">—</span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`${labelStyles.sm} font-mono text-text-subtle`}>
                    {t.updatedAt
                      ? new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </span>
                </div>
              </div>
            );
          })}
          {terms.length === 0 && (
            <div className={`${bodyStyles.md} text-text-muted text-center py-8`}>No terms found</div>
          )}
        </CardContent>
      </Card>

      {/* Inline form */}
      {formOpen && (
        <Card className="overflow-hidden animate-fade-in border-border-strong">
          <div className="h-0.5 bg-primary" />
          <CardContent className="p-6">
            {/* Form header */}
            <div className="flex items-start justify-between gap-5 mb-5">
              <div>
                <h3 className={`${headerStyles.xs} text-text-primary mb-1`}>Update term settings</h3>
                <p className={`${bodyStyles.sm} text-text-muted`}>
                  Select the current and enrolling terms. Changes apply immediately on save.
                </p>
              </div>
              <Button variant="outline" size="icon-xs" onClick={() => setFormOpen(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
              {/* Current term */}
              <div>
                <label className={`${labelStyles.sm} uppercase tracking-wider text-text-muted block mb-2`}>
                  Current term
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={currentTerm}
                      onChange={(e) => setCurrentTerm(e.target.value)}
                      aria-label="Current term semester"
                      className="w-full py-2.5 pl-3 pr-8 rounded-lg bg-surface-raised border border-border text-text-primary text-[13.5px] cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 hover:border-border-strong appearance-none"
                    >
                      {TERM_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {capitalize(t)}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                  <input
                    type="number"
                    value={currentYear}
                    onChange={(e) => setCurrentYear(e.target.value)}
                    placeholder="Year"
                    min={2020}
                    max={2035}
                    className="w-[78px] py-2.5 px-3 rounded-lg bg-surface-raised border border-border text-text-primary font-mono text-[13.5px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 hover:border-border-strong [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className={`${labelStyles.sm} text-text-subtle mt-1.5`}>
                  Preview:{" "}
                  <span className="text-text-primary font-medium">
                    {capitalize(currentTerm)} {currentYear}
                  </span>
                </div>
              </div>

              {/* Enrolling term */}
              <div>
                <label className={`${labelStyles.sm} uppercase tracking-wider text-text-muted block mb-2`}>
                  Enrolling term
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={enrollingTerm}
                      onChange={(e) => setEnrollingTerm(e.target.value)}
                      aria-label="Enrolling term semester"
                      className="w-full py-2.5 pl-3 pr-8 rounded-lg bg-surface-raised border border-border text-text-primary text-[13.5px] cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 hover:border-border-strong appearance-none"
                    >
                      {TERM_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {capitalize(t)}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                  <input
                    type="number"
                    value={enrollingYear}
                    onChange={(e) => setEnrollingYear(e.target.value)}
                    placeholder="Year"
                    min={2020}
                    max={2035}
                    className="w-[78px] py-2.5 px-3 rounded-lg bg-surface-raised border border-border text-text-primary font-mono text-[13.5px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 hover:border-border-strong [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className={`${labelStyles.sm} text-text-subtle mt-1.5`}>
                  Preview:{" "}
                  <span className="text-text-primary font-medium">
                    {capitalize(enrollingTerm)} {enrollingYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Error */}
            {formError && <div className={`${bodyStyles.md} text-destructive mb-4`}>{formError}</div>}

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-4 border-t border-border">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving…" : "Save changes"}
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
