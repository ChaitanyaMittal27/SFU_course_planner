import { formatPercent, formatTerm } from "@/lib/course-stats";
import { getEnrollmentStatus } from "@/lib/enrollment-status";
import { shareAtOrAbove } from "@/lib/grades";
import type { EnrollmentDataPoint, GradeDistribution } from "@/lib/types";

const SHORT_TERMS: Record<string, string> = { spring: "Sp", summer: "Su", fall: "F" };

/** "fall" + 2026 → "F26"; spring and summer use "Sp" / "Su" so they stay distinct. */
export function formatTermShort(term: string, year: number) {
  const prefix = SHORT_TERMS[term.toLowerCase()] ?? term.charAt(0).toUpperCase();
  return `${prefix}${String(year).slice(-2)}`;
}

/** Axis/table label for a data point: "Fall 2026", or "F26" when space is tight. */
export function termLabel(point: Pick<EnrollmentDataPoint, "term" | "year">, narrow = false) {
  return narrow ? formatTermShort(point.term, point.year) : formatTerm(point.term, point.year);
}

export function sortByTerm<T extends { semesterCode: number }>(points: T[]): T[] {
  return [...points].sort((a, b) => a.semesterCode - b.semesterCode);
}

/** "Average load 87% over 12 terms · full in 3 of them." */
export function loadSummary(points: EnrollmentDataPoint[]): string | null {
  if (points.length === 0) return null;
  const average = points.reduce((sum, point) => sum + point.loadPercent, 0) / points.length;
  const full = points.filter((point) => getEnrollmentStatus(point.loadPercent) === "full").length;
  const terms = points.length === 1 ? "1 term" : `${points.length} terms`;
  return `Average load ${Math.round(average)}% over ${terms} · full in ${full} of them.`;
}

/** Capacity at the first and last plotted terms, e.g. "Capacity grew from 120 in Fall 2021 to 200 in Spring 2026 (+80)." */
export function enrollmentSummary(points: EnrollmentDataPoint[]): string | null {
  if (points.length === 0) return null;
  const sorted = sortByTerm(points);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const from = termLabel(first);
  const to = termLabel(last);
  if (sorted.length === 1) return `Capacity was ${first.capacity} in ${from}.`;

  const change = last.capacity - first.capacity;
  if (change === 0) return `Capacity stayed at ${first.capacity} from ${from} to ${to}.`;
  const verb = change > 0 ? "grew" : "shrank";
  const sign = change > 0 ? "+" : "−";
  return `Capacity ${verb} from ${first.capacity} in ${from} to ${last.capacity} in ${to} (${sign}${Math.abs(change)}).`;
}

/** "Median B- · fail rate 8% · 74% of students get C- or better." */
export function gradesSummary(grades: GradeDistribution): string | null {
  const parts: string[] = [];
  if (grades.medianGrade) parts.push(`Median ${grades.medianGrade}`);
  const fail = formatPercent(grades.failRate);
  if (fail) parts.push(`fail rate ${fail}`);
  const passing = shareAtOrAbove(grades.distribution ?? {}, "C-");
  if (passing !== null) parts.push(`${Math.round(passing)}% of students get C- or better`);
  return parts.length > 0 ? `${parts.join(" · ")}.` : null;
}
