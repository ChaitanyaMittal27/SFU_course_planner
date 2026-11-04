import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseOffering } from "@/lib/types";

const mocks = vi.hoisted(() => ({ getOfferingDetail: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { getOfferingDetail: mocks.getOfferingDetail } }));
vi.mock("@/components/course/InstructorRatings", () => ({
  default: ({ sections, deptCode }: { sections: CourseOffering[]; deptCode: string }) => (
    <div>Instructor ratings for {sections.map((s) => s.section).join(", ")} in {deptCode}</div>
  ),
}));

import SectionComparisonResults from "@/components/course/SectionComparisonResults";

function section(label: string, instructors: string): CourseOffering {
  return {
    section: label, infoUrl: "/x", term: "fall", year: 2026, semesterCode: 1267, isEnrolling: true,
    location: "Burnaby", instructors, enrolled: "10", capacity: "20", loadPercent: 50,
  };
}

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };
const resolved = { deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225", department, course };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOfferingDetail.mockResolvedValue({
    sections: [section("CMPT 225 D100", "Fraser, Brian"), section("CMPT 225 D200", "Doe, John"), section("CMPT 225 D300", "Hall, Margaret")],
  });
});

describe("SectionComparisonResults instructor ratings", () => {
  it("shows instructor ratings for the compared sections only", async () => {
    render(
      <SectionComparisonResults course={resolved} semesterCode={1267} requestedSections={["D100", "D300"]} onSectionsChange={vi.fn()} />,
    );
    expect(await screen.findByText("Instructor ratings for CMPT 225 D100, CMPT 225 D300 in cmpt")).toBeInTheDocument();
  });

  it("does not show ratings until two sections are selected", async () => {
    render(
      <SectionComparisonResults course={resolved} semesterCode={1267} requestedSections={["D100"]} onSectionsChange={vi.fn()} />,
    );
    expect(await screen.findByText("Select one more section")).toBeInTheDocument();
    expect(screen.queryByText(/Instructor ratings/)).not.toBeInTheDocument();
  });
});
