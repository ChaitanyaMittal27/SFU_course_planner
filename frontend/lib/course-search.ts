import type { Course, Department } from "@/lib/types";

/**
 * Course search over data the browse page already loads: the department list plus
 * per-department course lists (api.getCourses). Full-text title search across every
 * department needs a backend endpoint (to-do #17); until then a query must start with
 * a department code.
 *
 * Rules:
 * - Codes are forgiving: "cmpt225", "CMPT 225", "cmpt-225", "Cmpt 22" (number prefix).
 * - The department code tolerates one typo (insert, delete, substitute, or swap two
 *   adjacent letters), e.g. "cmtp 225" → CMPT 225, reported as a suggestion.
 * - A department code alone ("cmpt") lists that department's courses.
 * - Department + words ("cmpt data struct") matches titles in that department; every
 *   word must start a word in the title.
 */

export const MIN_QUERY_LENGTH = 2;
export const DEFAULT_RESULT_LIMIT = 50;

export interface ParsedCourseQuery {
  /** Lowercase department token, e.g. "cmpt". */
  dept: string;
  /** Lowercase course-number prefix, e.g. "22" or "225w"; null when not given. */
  number: string | null;
  /** Lowercase title words, e.g. ["data", "struct"]. */
  words: string[];
}

export interface CourseSearchMatch {
  department: Department;
  course: Course;
}

export type CourseSearchOutcome =
  /** Query too short, or not shaped like a course search. */
  | { kind: "idle" }
  /** No department code matches, even allowing one typo. */
  | { kind: "noDepartment" }
  /** The matched department's courses are not loaded yet; load them and search again. */
  | { kind: "needsCourses"; department: Department; suggestion: Department | null }
  | { kind: "results"; department: Department; suggestion: Department | null; matches: CourseSearchMatch[] };

const DEPT_TOKEN = /^[a-z]{2,5}$/;
const NUMBER_TOKEN = /^\d{1,4}[a-z]?$/;
const JOINED_CODE = /^([a-z]{2,5})(\d{1,4}[a-z]?)$/;

/** Splits a raw query into department, number prefix, and title words. */
export function parseCourseQuery(raw: string): ParsedCourseQuery | null {
  const tokens = raw
    .toLowerCase()
    .replace(/[-_./,:]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0 || raw.trim().length < MIN_QUERY_LENGTH) return null;

  let [first, ...rest] = tokens;
  let number: string | null = null;

  const joined = JOINED_CODE.exec(first);
  if (joined) {
    first = joined[1];
    number = joined[2];
  } else if (!DEPT_TOKEN.test(first)) {
    return null;
  } else if (rest.length > 0 && NUMBER_TOKEN.test(rest[0])) {
    number = rest[0];
    rest = rest.slice(1);
  }

  return { dept: first, number, words: rest };
}

/** Optimal string alignment distance: Levenshtein plus adjacent transpositions. */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/**
 * Exact department code match, else the closest code within one edit (alphabetically
 * first on a tie). Typo tolerance needs at least 3 letters so "ma" never becomes "math".
 */
export function matchDepartment(
  token: string,
  departments: Department[],
): { department: Department; suggested: boolean } | null {
  const exact = departments.find((d) => d.deptCode.toLowerCase() === token);
  if (exact) return { department: exact, suggested: false };
  if (token.length < 3) return null;

  const close = departments
    .filter((d) => editDistance(token, d.deptCode.toLowerCase()) === 1)
    .sort((a, b) => a.deptCode.localeCompare(b.deptCode));
  return close.length > 0 ? { department: close[0], suggested: true } : null;
}

function compareCourseNumbers(a: Course, b: Course) {
  return a.courseNumber.localeCompare(b.courseNumber, undefined, { numeric: true, sensitivity: "base" });
}

function titleMatches(title: string | null, words: string[]) {
  if (words.length === 0) return true;
  const titleWords = (title ?? "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return words.every((word) => titleWords.some((titleWord) => titleWord.startsWith(word)));
}

/** Courses in one department that match the parsed number prefix and title words. */
export function filterCourses(query: ParsedCourseQuery, courses: Course[]): Course[] {
  return courses
    .filter((course) => (query.number === null || course.courseNumber.toLowerCase().startsWith(query.number)) && titleMatches(course.title, query.words))
    .sort(compareCourseNumbers);
}

export function searchCourses(
  raw: string,
  departments: Department[],
  coursesByDept: Record<number, Course[] | undefined>,
  limit = DEFAULT_RESULT_LIMIT,
): CourseSearchOutcome {
  const query = parseCourseQuery(raw);
  if (!query) return { kind: "idle" };

  const deptMatch = matchDepartment(query.dept, departments);
  if (!deptMatch) return { kind: "noDepartment" };

  const { department, suggested } = deptMatch;
  const suggestion = suggested ? department : null;
  const courses = coursesByDept[department.deptId];
  if (!courses) return { kind: "needsCourses", department, suggestion };

  const matches = filterCourses(query, courses)
    .slice(0, limit)
    .map((course) => ({ department, course }));
  return { kind: "results", department, suggestion, matches };
}
