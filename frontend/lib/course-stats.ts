import type { CourseOffering, TermInfo } from "@/lib/types";

/** "Summer" / "summer" + 2026 → "Summer 2026". */
export function formatTerm(term: string, year: number) {
  return `${term.charAt(0).toUpperCase()}${term.slice(1).toLowerCase()} ${year}`;
}

/** "CMPT" + "225" → "CMPT 225". */
export function formatCourseCode(deptCode: string, courseNumber: string) {
  return `${deptCode.toUpperCase()} ${courseNumber.toUpperCase()}`;
}

/** CourseSys counts arrive as strings ("40", sometimes "40 (+3)"); takes the leading number. */
export function parseCount(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const match = /\d+/.exec(value ?? "");
  return match ? Number(match[0]) : null;
}

/** 2.52 → "2.5%", 8 → "8%". */
export function formatPercent(value: number | null | undefined): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return `${Number(value.toFixed(1))}%`;
}

export interface SeatTotals {
  enrolled: number;
  capacity: number;
}

/** Sum of enrolled and capacity across sections; sections without numbers are skipped. */
export function sumSeats(sections: CourseOffering[]): SeatTotals | null {
  let enrolled = 0;
  let capacity = 0;
  let counted = 0;
  for (const section of sections) {
    const e = parseCount(section.enrolled);
    const c = parseCount(section.capacity);
    if (e === null || c === null) continue;
    enrolled += e;
    capacity += c;
    counted += 1;
  }
  return counted > 0 ? { enrolled, capacity } : null;
}

/**
 * Average seat load over the most recent completed terms. A term's load is its total
 * enrolled / total capacity across sections. "Completed" means before the enrolling
 * term (or, without one, not marked enrolling). Returns null if no term qualifies.
 */
export function averageRecentLoad(offerings: CourseOffering[], enrollingTerm: TermInfo | null, terms = 3): number | null {
  const byTerm = new Map<number, CourseOffering[]>();
  for (const offering of offerings) {
    const completed = enrollingTerm ? offering.semesterCode < enrollingTerm.semesterCode : !offering.isEnrolling;
    if (!completed) continue;
    byTerm.set(offering.semesterCode, [...(byTerm.get(offering.semesterCode) ?? []), offering]);
  }

  const loads = [...byTerm.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, sections]) => sumSeats(sections))
    .filter((totals): totals is SeatTotals => totals !== null && totals.capacity > 0)
    .slice(0, terms)
    .map((totals) => (totals.enrolled / totals.capacity) * 100);

  return loads.length > 0 ? loads.reduce((sum, load) => sum + load, 0) / loads.length : null;
}

/** Distinct, non-empty campus names in first-seen order. */
export function campusesOf(offerings: CourseOffering[]): string[] {
  return [...new Set(offerings.map((o) => o.location?.trim()).filter((value): value is string => Boolean(value)))];
}
