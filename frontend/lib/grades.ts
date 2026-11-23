/** SFU letter grades, best first. */
export const GRADE_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"] as const;

/** Position in GRADE_ORDER (0 = A+); lower is better. Null for missing or unknown grades. */
export function gradeRank(grade: string | null | undefined): number | null {
  if (!grade) return null;
  const index = (GRADE_ORDER as readonly string[]).indexOf(grade.trim().toUpperCase());
  return index === -1 ? null : index;
}

/**
 * Share of students (0–100) at or above a grade, counting only letter grades.
 * Null when the distribution has no letter-graded students.
 */
export function shareAtOrAbove(distribution: Record<string, number>, threshold: string): number | null {
  const cutoff = gradeRank(threshold);
  if (cutoff === null) return null;
  let total = 0;
  let atOrAbove = 0;
  GRADE_ORDER.forEach((grade, index) => {
    const count = distribution[grade] ?? 0;
    total += count;
    if (index <= cutoff) atOrAbove += count;
  });
  return total > 0 ? (atOrAbove / total) * 100 : null;
}
