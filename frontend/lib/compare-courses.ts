import { averageRecentLoad, campusesOf } from "@/lib/course-stats";
import { gradeRank } from "@/lib/grades";
import type { Course, CourseOffering, GradeDistribution, TermInfo } from "@/lib/types";

/** Terms counted for "Offered N of last X terms". */
export const OFFERED_WINDOW = 6;

/**
 * Index of the single lowest value, or null when fewer than two values can be
 * compared or the lowest value is tied. Lower is better for every compared row.
 */
export function bestIndex(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (present.length < 2) return null;
  const lowest = Math.min(...present);
  const matches = values.filter((value) => value === lowest).length;
  return matches === 1 ? values.indexOf(lowest) : null;
}

/** SFU semester codes step 1 → 4 → 7 within a year (spring, summer, fall). */
export function previousSemesterCode(code: number): number {
  const termDigit = code % 10;
  const yearPart = Math.floor(code / 10);
  if (termDigit === 1) return (yearPart - 1) * 10 + 7;
  return yearPart * 10 + (termDigit === 4 ? 1 : 4);
}

/** The `count` terms before `code`, most recent first. */
export function termsBefore(code: number, count: number): number[] {
  const terms: number[] = [];
  let current = code;
  for (let i = 0; i < count; i++) {
    current = previousSemesterCode(current);
    terms.push(current);
  }
  return terms;
}

/** How many of the last completed terms (before the enrolling term) had any offering. */
export function offeredInRecentTerms(offerings: CourseOffering[], enrollingTerm: TermInfo, window = OFFERED_WINDOW) {
  const offeredCodes = new Set(offerings.map((offering) => offering.semesterCode));
  const terms = termsBefore(enrollingTerm.semesterCode, window);
  return { offered: terms.filter((code) => offeredCodes.has(code)).length, total: terms.length };
}

export interface CompareCourseInput {
  deptCode: string;
  course: Course;
  /** Null when the grade request failed or has no data. */
  grades: GradeDistribution | null;
  offerings: CourseOffering[];
}

export interface CompareColumn {
  deptCode: string;
  courseNumber: string;
  title: string | null;
  medianGrade: string | null;
  failRate: number | null;
  avgLoad: number | null;
  units: number | null;
  campuses: string[];
  offered: { offered: number; total: number } | null;
  prerequisites: string | null;
  distribution: Record<string, number> | null;
}

export interface CourseComparison {
  columns: CompareColumn[];
  /** Column index of the single best value per row, or null (no highlight). */
  best: { medianGrade: number | null; failRate: number | null; avgLoad: number | null };
}

export function buildCourseComparison(inputs: CompareCourseInput[], enrollingTerm: TermInfo | null): CourseComparison {
  const columns = inputs.map(({ deptCode, course, grades, offerings }): CompareColumn => {
    const hasGrades = grades !== null && (Boolean(grades.medianGrade) || Object.keys(grades.distribution ?? {}).length > 0);
    return {
      deptCode: deptCode.toUpperCase(),
      courseNumber: course.courseNumber.toUpperCase(),
      title: course.title,
      medianGrade: hasGrades ? grades.medianGrade || null : null,
      failRate: hasGrades && Number.isFinite(grades.failRate) ? grades.failRate : null,
      avgLoad: averageRecentLoad(offerings, enrollingTerm),
      units: course.units,
      campuses: campusesOf(offerings),
      offered: enrollingTerm ? offeredInRecentTerms(offerings, enrollingTerm) : null,
      prerequisites: course.prerequisites,
      distribution: hasGrades && grades.distribution && Object.keys(grades.distribution).length > 0 ? grades.distribution : null,
    };
  });

  return {
    columns,
    best: {
      medianGrade: bestIndex(columns.map((column) => gradeRank(column.medianGrade))),
      failRate: bestIndex(columns.map((column) => column.failRate)),
      avgLoad: bestIndex(columns.map((column) => column.avgLoad)),
    },
  };
}
