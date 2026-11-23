import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const bookmarks = vi.hoisted(() => ({ ready: true, signedIn: false, find: () => undefined, add: async () => ({}), remove: async () => undefined }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/hooks/useSectionBookmarks", () => ({ useSectionBookmarks: () => bookmarks }));
vi.mock("@/components/course/BookmarkButton", () => ({
  default: ({ label, bookmarks: shared }: { label: string; bookmarks: unknown }) => (
    <button data-shared={shared === bookmarks}>Bookmark {label}</button>
  ),
}));
vi.mock("@/components/analytics/GradeHistogram", () => ({
  default: ({ medianGrade }: { medianGrade: string }) => <div>Grade chart, median {medianGrade}</div>,
}));
vi.mock("@/components/course/InstructorRatings", () => ({
  default: ({ sections, deptCode }: { sections: unknown[]; deptCode: string }) => (
    <div>Instructor ratings for {sections.length} sections in {deptCode}</div>
  ),
}));

import OfferingDetailScreen from "@/components/course/OfferingDetailScreen";

const section = { section: "CMPT 225 D100", infoUrl: "", term: "summer", year: 2026, semesterCode: 1267, isEnrolling: true, location: "Burnaby", instructors: "Ada", enrolled: "40", capacity: "45", loadPercent: 89 };
const detail = {
  deptId: 14, courseId: 3998, deptCode: "CMPT", courseNumber: "225", title: "Data Structures", term: "Summer", year: 2026,
  campus: "Burnaby", medianGrade: "A-", failRate: 2.52, gradeDistribution: { A: 10 }, description: "Core data structures.", prerequisites: "CMPT 125",
  corequisites: null, units: 3, degreeLevel: "UGRD", designation: "Q", outlineUrl: "",
  sections: [section, { ...section, section: "CMPT 225 D200", enrolled: "50", capacity: "50", loadPercent: 100 }],
};

describe("OfferingDetailScreen", () => {
  it("renders the breadcrumb, heading and summary without an outer card", () => {
    render(<OfferingDetailScreen detail={detail} backHref="/browse/cmpt/225" />);
    const crumbs = screen.getByRole("navigation", { name: "breadcrumb" });
    expect(within(crumbs).getByRole("link", { name: "Browse" })).toHaveAttribute("href", "/browse");
    expect(within(crumbs).getByRole("link", { name: "CMPT 225" })).toHaveAttribute("href", "/browse/cmpt/225");
    expect(crumbs).toHaveTextContent("Summer 2026");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("CMPT 225 · Data Structures");
    expect(screen.getByText("Summer 2026 · 3 units · 2 sections")).toBeInTheDocument();

    const summary = screen.getByText("Seats taken").closest("dl") as HTMLElement;
    expect(within(summary).getByText("90 / 95")).toBeInTheDocument();
    expect(within(summary).getByText("A-")).toBeInTheDocument();
    expect(within(summary).getByText("2.5%")).toBeInTheDocument();
    expect(screen.getByText("Q")).toBeInTheDocument();
    expect(screen.getByText("UGRD")).toBeInTheDocument();
  });

  it("lists sections with status, an outline link and a shared bookmark state", () => {
    render(<OfferingDetailScreen detail={detail} backHref="/browse/cmpt/225" />);
    expect(screen.getByRole("heading", { level: 2, name: "Sections" })).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Open")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Full")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Outline for D100 (opens in a new tab)" })).toHaveAttribute(
      "href",
      "https://www.sfu.ca/outlines.html?2026/summer/cmpt/225/d100",
    );
    expect(screen.getByRole("button", { name: "Bookmark CMPT 225 D100" })).toHaveAttribute("data-shared", "true");
    const sectionsCard = screen.getByRole("heading", { level: 2, name: "Sections" }).closest("section") as HTMLElement;
    expect(within(sectionsCard).getByText("Bookmarked sections are included in your morning email")).toBeInTheDocument();
    expect(within(sectionsCard).getByRole("table")).toBeInTheDocument();
  });

  it("shows instructors, grades, description and prerequisites as sections", () => {
    render(<OfferingDetailScreen detail={detail} backHref="/browse/cmpt/225" />);
    expect(screen.getByText("Instructor ratings for 2 sections in CMPT")).toBeInTheDocument();
    const gradesCard = screen.getByRole("heading", { level: 2, name: "Grade distribution" }).closest("section") as HTMLElement;
    expect(gradesCard).toHaveTextContent("All terms · CourseDiggers");
    expect(within(gradesCard).getByText("Grade chart, median A-")).toBeInTheDocument();
    expect(screen.getByText("Grade chart, median A-")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Description" })).toBeInTheDocument();
    expect(screen.getByText("Core data structures.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Prerequisites" })).toBeInTheDocument();
    expect(screen.getByText("CMPT 125")).toBeInTheDocument();
  });

  it("explains when the offering has no section data", () => {
    render(<OfferingDetailScreen detail={{ ...detail, sections: [], gradeDistribution: null, medianGrade: null }} backHref="/browse/cmpt/225" />);
    expect(screen.getByText("No section data found.")).toBeInTheDocument();
    expect(screen.queryByText(/Grade chart/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Instructor ratings/)).not.toBeInTheDocument();
    expect(screen.queryByText("Seats taken")).not.toBeInTheDocument();
    expect(screen.queryByText("Fail rate")).not.toBeInTheDocument();
  });
});
