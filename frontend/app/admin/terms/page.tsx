"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { api, AdminTerm } from "@/lib/api";
import { formatTerm, isTermName, semesterCode, TERM_OPTIONS, type TermName } from "@/lib/semester";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import SectionCard, { cardTable } from "@/components/course/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AdminPage, AdminPageHeader, AdminStats, AdminTable } from "@/components/admin/AdminPage";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatUpdatedAt(updatedAt: string | null) {
  return updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

function statusBadge(label: string) {
  return (
    <Badge className="border-transparent bg-success-tint text-success-text">
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

export default function AdminTermsPage() {
  const [terms, setTerms] = useState<AdminTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState("");
  const [currentTerm, setCurrentTerm] = useState<TermName>("spring");
  const [enrollingYear, setEnrollingYear] = useState("");
  const [enrollingTerm, setEnrollingTerm] = useState<TermName>("summer");
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTerms = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getAdminTerms();
      setTerms(data);

      const current = data.find((term) => term.isCurrent);
      const enrolling = data.find((term) => term.isEnrolling);
      if (current && isTermName(current.term)) {
        setCurrentYear(String(current.year));
        setCurrentTerm(current.term);
      }
      if (enrolling && isTermName(enrolling.term)) {
        setEnrollingYear(String(enrolling.year));
        setEnrollingTerm(enrolling.term);
      }
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, "Failed to load terms"));
    }
  }, []);

  useEffect(() => {
    fetchTerms().finally(() => setLoading(false));
  }, [fetchTerms]);

  const openForm = () => {
    setFormError(null);
    setSaveMessage(null);
    setFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const parsedCurrentYear = Number.parseInt(currentYear, 10);
    const parsedEnrollingYear = Number.parseInt(enrollingYear, 10);
    const currentCode = semesterCode(parsedCurrentYear, currentTerm);
    const enrollingCode = semesterCode(parsedEnrollingYear, enrollingTerm);

    if (!currentYear || !enrollingYear || Number.isNaN(parsedCurrentYear) || Number.isNaN(parsedEnrollingYear)) {
      setFormError("Both year fields are required.");
      return;
    }
    if (parsedCurrentYear === parsedEnrollingYear && currentTerm === enrollingTerm) {
      setFormError("Current and enrolling terms cannot be the same.");
      return;
    }
    if (currentCode === null || enrollingCode === null || enrollingCode <= currentCode) {
      setFormError("The enrolling term must be chronologically after the current term.");
      return;
    }

    setSubmitting(true);
    try {
      const updatedTerms = await api.updateTerms({
        currentYear: parsedCurrentYear,
        currentTerm,
        enrollingYear: parsedEnrollingYear,
        enrollingTerm,
      });
      setTerms(updatedTerms);
      setFormOpen(false);
      setSaveMessage(`Saved: current ${formatTerm(currentTerm)} ${parsedCurrentYear}; enrolling ${formatTerm(enrollingTerm)} ${parsedEnrollingYear}.`);
    } catch (requestError: unknown) {
      setFormError(errorMessage(requestError, "Failed to update terms"));
    } finally {
      setSubmitting(false);
    }
  };

  const currentTermRecord = terms.find((term) => term.isCurrent);
  const enrollingTermRecord = terms.find((term) => term.isEnrolling);
  const currentCode = currentTermRecord ? semesterCode(currentTermRecord.year, currentTermRecord.term) : null;

  if (loading) {
    return <AdminPageSkeleton statCards={2} hasTable tableRows={4} />;
  }

  const headerActions = (
    <Button type="button" variant="outline" onClick={() => (formOpen ? setFormOpen(false) : openForm())} className="gap-2">
      <Pencil />
      {formOpen ? "Cancel" : "Update terms"}
    </Button>
  );

  if (error && terms.length === 0) {
    return (
      <AdminPage>
        <AdminPageHeader title="Terms management" description="Control the current and enrolling academic terms." actions={headerActions} />
        <ErrorMessage message={error} onRetry={fetchTerms} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminPageHeader title="Terms management" description="Control the current and enrolling academic terms." actions={headerActions} />

      {error && <ErrorMessage className="mb-6" message={error} onRetry={fetchTerms} />}

      {saveMessage && (
        <p className={`${bodyStyles.sm} mb-6 flex items-center gap-1.5 text-success-text`} role="status">
          <Check className="size-3.5" />
          {saveMessage}
        </p>
      )}

      <AdminStats
        items={[
          { label: "Enrolling term", value: enrollingTermRecord ? `${formatTerm(enrollingTermRecord.term)} ${enrollingTermRecord.year}` : "Not set" },
          { label: "Current term", value: currentTermRecord ? `${formatTerm(currentTermRecord.term)} ${currentTermRecord.year}` : "Not set" },
        ]}
      />

      <AdminTable title="All terms" note={`${terms.length} configured`} className="mb-6">
          <Table className="">
            <TableHeader>
              <TableRow className={cardTable.headRow}>
                <TableHead className={cardTable.head}>Term</TableHead>
                <TableHead className={cn(cardTable.head, "text-center")}>Enrolling</TableHead>
                <TableHead className={cn(cardTable.head, "text-center")}>Current</TableHead>
                <TableHead className={cn(cardTable.head, "text-right")}>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => {
                const code = semesterCode(term.year, term.term);
                const isPast = currentCode !== null && code !== null && code < currentCode;

                return (
                  <TableRow key={term.termId} className={cardTable.row}>
                    <TableCell className={cardTable.cell}>
                      <span className={`${labelStyles.lg} ${isPast ? "font-normal text-text-muted" : "font-medium text-text-primary"}`}>
                        {formatTerm(term.term)} {term.year}
                      </span>
                    </TableCell>
                    <TableCell className={cn(cardTable.cell, "text-center")}>{term.isEnrolling ? statusBadge("Enrolling") : <span className="text-text-subtle">—</span>}</TableCell>
                    <TableCell className={cn(cardTable.cell, "text-center")}>{term.isCurrent ? statusBadge("Current") : <span className="text-text-subtle">—</span>}</TableCell>
                    <TableCell className={cn(cardTable.cell, numericStyles.sm, "text-right text-text-subtle")}>{formatUpdatedAt(term.updatedAt)}</TableCell>
                  </TableRow>
                );
              })}
              {terms.length === 0 && (
                <TableRow className={cardTable.row}>
                  <TableCell colSpan={4} className={cn(cardTable.cell, bodyStyles.md, "py-8 text-center text-text-muted")}>No terms found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </AdminTable>

      {formOpen && (
        <SectionCard
          title="Update term settings"
          description="Changes apply immediately and change the default term used by Browse, Graph, and bookmark status."
        >

            <form onSubmit={handleSubmit}>
              <div className="mb-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                <TermFields
                  id="current"
                  label="Current term"
                  term={currentTerm}
                  year={currentYear}
                  onTermChange={setCurrentTerm}
                  onYearChange={setCurrentYear}
                />
                <TermFields
                  id="enrolling"
                  label="Enrolling term"
                  term={enrollingTerm}
                  year={enrollingYear}
                  onTermChange={setEnrollingTerm}
                  onYearChange={setEnrollingYear}
                />
              </div>

              {formError && <p className={`${bodyStyles.md} mb-4 text-destructive-text`} role="alert">{formError}</p>}

              <div className="flex items-center gap-2.5 border-t border-border pt-4">
                <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save changes"}</Button>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </form>
        </SectionCard>
      )}
    </AdminPage>
  );
}

type TermFieldsProps = {
  id: string;
  label: string;
  term: TermName;
  year: string;
  onTermChange: (term: TermName) => void;
  onYearChange: (year: string) => void;
};

function TermFields({ id, label, term, year, onTermChange, onYearChange }: TermFieldsProps) {
  return (
    <div>
      <label htmlFor={`${id}-term`} className={`${labelStyles.sm} mb-2 block uppercase tracking-wider text-text-muted`}>{label}</label>
      <div className="flex gap-2">
        <NativeSelect id={`${id}-term`} className="min-w-0 flex-1" value={term} onChange={(event) => onTermChange(event.target.value as TermName)}>
          {TERM_OPTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {formatTerm(option)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Input
          id={`${id}-year`}
          type="number"
          value={year}
          onChange={(event) => onYearChange(event.target.value)}
          placeholder="Year"
          min={2020}
          max={2035}
          className={`w-24 ${numericStyles.base}`}
          aria-label={`${label} year`}
        />
      </div>
      <p className={`${labelStyles.sm} mt-1.5 text-text-subtle`}>
        Preview: <span className="font-medium text-text-primary">{formatTerm(term)} {year || "year"}</span>
      </p>
    </div>
  );
}
