import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/course/BookmarkButton", () => ({ default: () => <button>Bookmark</button> }));
vi.mock("@/components/analytics/GradeHistogram", () => ({ default: () => <div>Grade chart</div> }));
vi.mock("@/components/course/InstructorRatings", () => ({
  default: ({ sections, deptCode }: { sections: unknown[]; deptCode: string }) => (
    <div>Instructor ratings for {sections.length} sections in {deptCode}</div>
  ),
}));

import OfferingDetailScreen from "@/components/course/OfferingDetailScreen";

const detail = {
  deptId: 14, courseId: 3998, deptCode: "CMPT", courseNumber: "225", title: "Data Structures", term: "Summer", year: 2026,
  campus: "Burnaby", medianGrade: "A-", failRate: 2.5, gradeDistribution: { A: 10 }, description: "Core data structures.", prerequisites: null,
  corequisites: null, units: 3, degreeLevel: "UGRD", designation: null, outlineUrl: "", sections: [{ section: "CMPT 225 D100", infoUrl: "", term: "summer", year: 2026, semesterCode: 1267, isEnrolling: true, location: "Burnaby", instructors: "Ada", enrolled: "40", capacity: "45", loadPercent: 89 }],
};

describe("OfferingDetailScreen", () => {
  it("renders details, an outline link, and navigates back to the canonical offering list", async () => {
    const user = userEvent.setup();
    render(<OfferingDetailScreen detail={detail} backHref="/browse/cmpt/225" />);
    expect(screen.getByText("Data Structures")).toBeInTheDocument();
    expect(screen.getByText("Grade chart")).toBeInTheDocument();
    expect(screen.getByText("Instructor ratings for 1 sections in CMPT")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open outline" })).toHaveAttribute("href", "https://www.sfu.ca/outlines.html?2026/summer/cmpt/225/d100");

    await user.click(screen.getByRole("button", { name: "Back to offerings" }));
    expect(push).toHaveBeenCalledWith("/browse/cmpt/225");
  });

  it("explains when the offering has no section data", () => {
    render(<OfferingDetailScreen detail={{ ...detail, sections: [], gradeDistribution: null }} backHref="/browse/cmpt/225" />);
    expect(screen.getByText("No section data found.")).toBeInTheDocument();
    expect(screen.queryByText("Grade chart")).not.toBeInTheDocument();
    expect(screen.queryByText(/Instructor ratings/)).not.toBeInTheDocument();
  });
});
