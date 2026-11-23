import { describe, expect, it } from "vitest";
import { editDistance, matchDepartment, parseCourseQuery, searchCourses } from "@/lib/course-search";
import type { Course, Department } from "@/lib/types";

const cmpt: Department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const math: Department = { deptId: 20, deptCode: "MATH", name: "Mathematics" };
const macm: Department = { deptId: 21, deptCode: "MACM", name: "Mathematics and Computing" };
const departments = [cmpt, math, macm];

function course(courseId: number, courseNumber: string, title: string): Course {
  return { courseId, deptId: 14, courseNumber, title, description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };
}

const cmptCourses = [
  course(3, "276", "Introduction to Software Engineering"),
  course(1, "225", "Data Structures and Programming"),
  course(2, "213", "Object-Oriented Design in Java"),
  course(4, "307", "Data Structures and Algorithms"),
  course(5, "2250", "Hypothetical Long Number"),
];
const loaded = { [cmpt.deptId]: cmptCourses };

function codes(raw: string) {
  const outcome = searchCourses(raw, departments, loaded);
  return outcome.kind === "results" ? outcome.matches.map((m) => m.course.courseNumber) : outcome.kind;
}

describe("parseCourseQuery", () => {
  it.each([
    ["cmpt225", { dept: "cmpt", number: "225", words: [] }],
    ["CMPT 225", { dept: "cmpt", number: "225", words: [] }],
    ["cmpt-225", { dept: "cmpt", number: "225", words: [] }],
    ["  Cmpt   22 ", { dept: "cmpt", number: "22", words: [] }],
    ["cmpt 105w", { dept: "cmpt", number: "105w", words: [] }],
    ["cmpt", { dept: "cmpt", number: null, words: [] }],
    ["cmpt data struct", { dept: "cmpt", number: null, words: ["data", "struct"] }],
  ])("parses %j", (raw, expected) => {
    expect(parseCourseQuery(raw)).toEqual(expected);
  });

  it("rejects empty, too-short, and non-code queries", () => {
    expect(parseCourseQuery("")).toBeNull();
    expect(parseCourseQuery("c")).toBeNull();
    expect(parseCourseQuery("225")).toBeNull();
    expect(parseCourseQuery("computing science")).toBeNull();
  });
});

describe("editDistance", () => {
  it("counts an adjacent swap as one edit", () => {
    expect(editDistance("cmtp", "cmpt")).toBe(1);
    expect(editDistance("cmp", "cmpt")).toBe(1);
    expect(editDistance("cmpx", "cmpt")).toBe(1);
    expect(editDistance("xyz", "cmpt")).toBeGreaterThan(1);
  });
});

describe("matchDepartment", () => {
  it("prefers an exact code, case-insensitively", () => {
    expect(matchDepartment("math", departments)).toEqual({ department: math, suggested: false });
  });

  it("suggests a code one edit away", () => {
    expect(matchDepartment("cmtp", departments)).toEqual({ department: cmpt, suggested: true });
  });

  it("does not guess from very short tokens", () => {
    expect(matchDepartment("ma", departments)).toBeNull();
  });
});

describe("searchCourses", () => {
  it("matches forgiving code formats", () => {
    for (const raw of ["cmpt225", "CMPT 225", "cmpt-225"]) {
      expect(codes(raw)).toEqual(["225", "2250"]);
    }
  });

  it("treats the number as a prefix", () => {
    expect(codes("Cmpt 22")).toEqual(["225", "2250"]);
    expect(codes("cmpt 2")).toEqual(["213", "225", "276", "2250"]);
  });

  it("corrects a department typo and reports the suggestion", () => {
    const outcome = searchCourses("cmtp 225", departments, loaded);
    expect(outcome).toMatchObject({ kind: "results", suggestion: cmpt });
    expect(outcome.kind === "results" && outcome.matches[0].course.courseNumber).toBe("225");
    expect(searchCourses("cmpt 225", departments, loaded)).toMatchObject({ suggestion: null });
  });

  it("lists a department's courses for a code alone, in number order", () => {
    expect(codes("cmpt")).toEqual(["213", "225", "276", "307", "2250"]);
  });

  it("matches title words within the department, all words, by prefix", () => {
    expect(codes("cmpt data struct")).toEqual(["225", "307"]);
    expect(codes("cmpt data struct algo")).toEqual(["307"]);
    expect(codes("cmpt soft eng")).toEqual(["276"]);
  });

  it("returns an empty result list when nothing matches", () => {
    expect(codes("cmpt 999")).toEqual([]);
    expect(codes("cmpt quantum")).toEqual([]);
  });

  it("asks for the department's courses before it can match", () => {
    expect(searchCourses("math 232", departments, loaded)).toEqual({ kind: "needsCourses", department: math, suggestion: null });
  });

  it("is idle for short or unsupported queries and reports unknown departments", () => {
    expect(searchCourses("c", departments, loaded)).toEqual({ kind: "idle" });
    expect(searchCourses("data structures", departments, loaded)).toEqual({ kind: "noDepartment" });
    expect(searchCourses("zzzz 101", departments, loaded)).toEqual({ kind: "noDepartment" });
  });

  it("caps the number of results", () => {
    const outcome = searchCourses("cmpt", departments, loaded, 2);
    expect(outcome.kind === "results" && outcome.matches).toHaveLength(2);
  });
});
