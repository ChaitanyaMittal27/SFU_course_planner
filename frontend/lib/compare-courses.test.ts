import { describe, expect, it } from "vitest";
import { bestIndex, buildCourseComparison, offeredInRecentTerms, previousSemesterCode, termsBefore } from "@/lib/compare-courses";
import type { Course, CourseOffering } from "@/lib/types";

function course(courseNumber: string, extra: Partial<Course> = {}): Course {
  return { courseId: Number(courseNumber), deptId: 14, courseNumber, title: `Course ${courseNumber}`, description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null, ...extra };
}

function offering(semesterCode: number, enrolled: number, capacity: number, location = "Burnaby"): CourseOffering {
  return { section: "D100", infoUrl: "", term: "fall", year: 2025, semesterCode, isEnrolling: false, location, instructors: "", enrolled: String(enrolled), capacity: String(capacity), loadPercent: Math.round((enrolled / capacity) * 100) };
}

const enrolling = { term: "spring", year: 2027, semesterCode: 1271 };

describe("bestIndex", () => {
  it("returns the single lowest value", () => {
    expect(bestIndex([8, 6, 9])).toBe(1);
  });

  it("returns null on a tie for the lowest value", () => {
    expect(bestIndex([6, 6, 9])).toBeNull();
  });

  it("ignores missing values but needs two comparable values", () => {
    expect(bestIndex([null, 7, 5])).toBe(2);
    expect(bestIndex([null, 7, null])).toBeNull();
    expect(bestIndex([])).toBeNull();
  });
});

describe("terms", () => {
  it("steps back through SFU terms across years", () => {
    expect(previousSemesterCode(1271)).toBe(1267);
    expect(previousSemesterCode(1267)).toBe(1264);
    expect(previousSemesterCode(1264)).toBe(1261);
    expect(termsBefore(1271, 6)).toEqual([1267, 1264, 1261, 1257, 1254, 1251]);
  });

  it("counts offered terms among the last six completed terms", () => {
    const offerings = [offering(1267, 1, 2), offering(1267, 1, 2), offering(1261, 1, 2), offering(1271, 1, 2), offering(1241, 1, 2)];
    expect(offeredInRecentTerms(offerings, enrolling)).toEqual({ offered: 2, total: 6 });
  });
});

describe("buildCourseComparison", () => {
  const grades = (medianGrade: string, failRate: number) => ({ deptCode: "CMPT", courseNumber: "", title: "", medianGrade, failRate, distribution: { A: 1 } });

  it("builds columns and marks the best median, fail rate and load", () => {
    const result = buildCourseComparison(
      [
        { deptCode: "cmpt", course: course("225", { prerequisites: "CMPT 125" }), grades: grades("B-", 8), offerings: [offering(1267, 90, 100), offering(1264, 80, 100, "Surrey")] },
        { deptCode: "cmpt", course: course("213"), grades: grades("B", 6), offerings: [offering(1267, 50, 100)] },
      ],
      enrolling,
    );

    expect(result.columns[0]).toMatchObject({
      deptCode: "CMPT", courseNumber: "225", medianGrade: "B-", failRate: 8, avgLoad: 85, units: 3,
      campuses: ["Burnaby", "Surrey"], offered: { offered: 2, total: 6 }, prerequisites: "CMPT 125",
    });
    // B is better than B- (lower grade rank), 6% beats 8%, 50% load beats 85%.
    expect(result.best).toEqual({ medianGrade: 1, failRate: 1, avgLoad: 1 });
  });

  it("does not highlight ties or rows without data", () => {
    const result = buildCourseComparison(
      [
        { deptCode: "cmpt", course: course("225"), grades: grades("B", 6), offerings: [] },
        { deptCode: "cmpt", course: course("213"), grades: grades("B", 6), offerings: [] },
        { deptCode: "cmpt", course: course("300"), grades: null, offerings: [] },
      ],
      null,
    );
    expect(result.best).toEqual({ medianGrade: null, failRate: null, avgLoad: null });
    expect(result.columns[2]).toMatchObject({ medianGrade: null, failRate: null, distribution: null, offered: null });
  });
});
