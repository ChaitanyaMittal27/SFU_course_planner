import { describe, expect, it } from "vitest";
import { enrollmentSummary, formatTermShort, gradesSummary, loadSummary, termLabel } from "@/lib/analytics-summary";
import { gradeRank, shareAtOrAbove } from "@/lib/grades";
import type { EnrollmentDataPoint } from "@/lib/types";

function point(semesterCode: number, term: string, year: number, enrolled: number, capacity: number): EnrollmentDataPoint {
  return { semesterCode, term, year, enrolled, capacity, loadPercent: Math.round((enrolled / capacity) * 100) };
}

describe("term labels", () => {
  it("formats readable and short labels, never raw semester codes", () => {
    expect(termLabel({ term: "fall", year: 2026 })).toBe("Fall 2026");
    expect(termLabel({ term: "fall", year: 2026 }, true)).toBe("F26");
    expect(formatTermShort("spring", 2027)).toBe("Sp27");
    expect(formatTermShort("summer", 2026)).toBe("Su26");
  });
});

describe("loadSummary", () => {
  it("averages load and counts full terms", () => {
    expect(loadSummary([point(1257, "fall", 2025, 80, 100), point(1261, "spring", 2026, 100, 100), point(1264, "summer", 2026, 105, 100)])).toBe(
      "Average load 95% over 3 terms · full in 2 of them.",
    );
    expect(loadSummary([point(1257, "fall", 2025, 50, 100)])).toBe("Average load 50% over 1 term · full in 0 of them.");
    expect(loadSummary([])).toBeNull();
  });
});

describe("enrollmentSummary", () => {
  it("reports variation even when the first and last capacities match", () => {
    expect(enrollmentSummary([
      point(1264, "summer", 2026, 100, 120),
      point(1261, "spring", 2026, 100, 200),
      point(1257, "fall", 2025, 100, 120),
    ])).toBe("Capacity ranged from 120 to 200 seats between Fall 2025 and Summer 2026.");
  });

  it("uses raw seat counts for load averages and full-term counts", () => {
    expect(loadSummary([point(1264, "summer", 2026, 199, 200)]))
      .toBe("Average load 99% over 1 term · full in 0 of them.");
  });
  it("describes the capacity change between the first and last terms, in term order", () => {
    expect(enrollmentSummary([point(1264, "summer", 2026, 150, 200), point(1217, "fall", 2021, 100, 120)])).toBe(
      "Capacity ranged from 120 to 200 seats between Fall 2021 and Summer 2026.",
    );
    expect(enrollmentSummary([point(1217, "fall", 2021, 100, 200), point(1264, "summer", 2026, 150, 150)])).toBe(
      "Capacity ranged from 150 to 200 seats between Fall 2021 and Summer 2026.",
    );
    expect(enrollmentSummary([point(1217, "fall", 2021, 100, 120), point(1264, "summer", 2026, 150, 120)])).toBe(
      "Capacity stayed at 120 from Fall 2021 to Summer 2026.",
    );
    expect(enrollmentSummary([point(1217, "fall", 2021, 100, 120)])).toBe("Capacity was 120 in Fall 2021.");
    expect(enrollmentSummary([])).toBeNull();
  });
});

describe("gradesSummary", () => {
  it("combines median, fail rate and the share at C- or better", () => {
    const grades = { deptCode: "CMPT", courseNumber: "225", title: "", medianGrade: "B-", failRate: 8, distribution: { A: 30, "B-": 30, "C-": 14, D: 10, F: 16 } };
    expect(gradesSummary(grades)).toBe("Median B- · fail rate 8% · 74% of students get C- or better.");
  });

  it("leaves out missing parts", () => {
    expect(gradesSummary({ deptCode: "", courseNumber: "", title: "", medianGrade: "", failRate: Number.NaN, distribution: {} })).toBeNull();
  });
});

describe("grades helpers", () => {
  it("ranks grades best first and ignores unknown ones", () => {
    expect(gradeRank("A+")).toBe(0);
    expect(gradeRank("b-")).toBe(5);
    expect(gradeRank("W")).toBeNull();
    expect(shareAtOrAbove({ A: 1, F: 1, W: 5 }, "C-")).toBe(50);
  });
});
