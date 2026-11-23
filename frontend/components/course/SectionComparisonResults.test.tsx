import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseOffering, RmpLookup } from "@/lib/types";

const mocks = vi.hoisted(() => ({ getOfferingDetail: vi.fn(), getRmp: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { getOfferingDetail: mocks.getOfferingDetail, getRmp: mocks.getRmp } }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));

import SectionComparisonResults from "@/components/course/SectionComparisonResults";
import { clearRmpLookupCache } from "@/hooks/useRmpLookups";

function section(label: string, instructors: string, extra: Partial<CourseOffering> = {}): CourseOffering {
  return {
    section: label, infoUrl: "/x", term: "summer", year: 2026, semesterCode: 1267, isEnrolling: true,
    location: "Burnaby", instructors, enrolled: "10", capacity: "20", loadPercent: 50, ...extra,
  };
}

const matched: RmpLookup = {
  status: "MATCHED", lookupId: 1, searchName: "Brian Fraser", searchUrl: "https://rmp.test/s",
  teacher: { firstName: "Brian", lastName: "Fraser", department: "CS", avgRating: 4.3, avgDifficulty: 2, numRatings: 10, wouldTakeAgainPercent: 90, profileUrl: null, matchScore: 1 },
};
const noMatch: RmpLookup = { status: "NO_MATCH", lookupId: 2, searchName: "John Doe", searchUrl: "https://rmp.test/s", teacher: null };

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };
const resolved = { deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225", department, course };

const threeSections = [
  section("CMPT 225 D100", "Fraser, Brian"),
  section("CMPT 225 D200", "Doe, John", { location: "Surrey", enrolled: "20", loadPercent: 100 }),
  section("CMPT 225 D300", "Hall, Margaret"),
];

function renderResults(requestedSections: string[], onSectionsChange = vi.fn()) {
  render(<SectionComparisonResults course={resolved} semesterCode={1267} requestedSections={requestedSections} onSectionsChange={onSectionsChange} />);
  return onSectionsChange;
}

beforeEach(() => {
  vi.clearAllMocks();
  clearRmpLookupCache();
  mocks.getOfferingDetail.mockResolvedValue({ sections: threeSections });
  mocks.getRmp.mockImplementation((name: string) => Promise.resolve(name === "Fraser, Brian" ? matched : noMatch));
});

describe("SectionComparisonResults", () => {
  it("compares the selected sections in one card with an RMP row", async () => {
    renderResults(["D100", "D200"]);
    const card = (await screen.findByRole("heading", { level: 2, name: "CMPT 225 · Fall 2026" })).closest("section") as HTMLElement;
    expect(card).toHaveTextContent("2 sections selected");
    expect(screen.queryByText(/Select at least two sections/)).not.toBeInTheDocument();

    const table = within(card).getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Measure", "D100", "D200"]);
    const row = (label: string) => within(table).getByRole("rowheader", { name: label }).closest("tr") as HTMLElement;
    expect(row("Instructor")).toHaveTextContent("Brian Fraser");
    expect(row("Campus")).toHaveTextContent("Surrey");
    expect(row("Enrolled / cap")).toHaveTextContent("20 / 20");
    expect(within(row("Load")).getByText("Full")).toBeInTheDocument();
    expect(within(row("Load")).getByText("Open")).toBeInTheDocument();
    expect(within(row("Load")).getAllByRole("progressbar")).toHaveLength(2);
    expect(within(row("Details")).getByRole("link", { name: "View offering for D100" })).toHaveAttribute("href", "/browse/cmpt/225/1267");

    await waitFor(() => expect(within(row("RMP rating")).getByText("4.3")).toBeInTheDocument());
    expect(within(row("RMP rating")).getByText("No match")).toHaveClass("text-text-subtle");
    expect(mocks.getRmp).not.toHaveBeenCalledWith("Hall, Margaret", "cmpt");
  });

  it("toggles sections as pressed buttons and reports changes", async () => {
    const user = userEvent.setup();
    const onChange = renderResults(["D100"]);
    const group = await screen.findByRole("group", { name: "Sections of CMPT 225 in Fall 2026" });
    const d100 = within(group).getByRole("button", { name: /D100/ });
    expect(d100).toHaveAttribute("aria-pressed", "true");
    expect(within(group).getByRole("button", { name: /D200/ })).toHaveTextContent("Surrey");

    await user.click(within(group).getByRole("button", { name: /D300/ }));
    expect(onChange).toHaveBeenCalledWith(["D100", "D300"]);
  });

  it("limits the comparison to three sections with an inline status", async () => {
    const user = userEvent.setup();
    mocks.getOfferingDetail.mockResolvedValue({ sections: [...threeSections, section("CMPT 225 D400", "Ng, Andy")] });
    const onChange = renderResults(["D100", "D200", "D300"]);
    await user.click(await screen.findByRole("button", { name: /D400/ }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("You can compare up to 3 sections at a time.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("asks for a second section, without any results", async () => {
    renderResults(["D100"]);
    expect(await screen.findByRole("heading", { name: "Select at least two sections to compare." })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/Only one section/)).not.toBeInTheDocument();
  });

  it("explains a term with a single section instead of asking for a selection", async () => {
    mocks.getOfferingDetail.mockResolvedValue({ sections: [threeSections[0]] });
    renderResults([]);
    expect(await screen.findByRole("heading", { name: "Only one section of CMPT 225 in Fall 2026. Pick another term to compare." })).toBeInTheDocument();
    expect(screen.queryByText(/Select at least two sections/)).not.toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("retries when the sections fail to load", async () => {
    const user = userEvent.setup();
    mocks.getOfferingDetail.mockRejectedValueOnce(new Error("offline"));
    renderResults(["D100", "D200"]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load sections");
    await user.click(screen.getByRole("button", { name: "Try Again" }));
    expect(await screen.findByRole("heading", { level: 2, name: "CMPT 225 · Fall 2026" })).toBeInTheDocument();
  });
});
