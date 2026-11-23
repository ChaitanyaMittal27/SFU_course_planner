import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseOffering } from "@/lib/types";

const mocks = vi.hoisted(() => ({ getOfferings: vi.fn(), getEnrollingTerm: vi.fn(), getGradeDistribution: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/lib/api", () => ({
  api: { getOfferings: mocks.getOfferings, getEnrollingTerm: mocks.getEnrollingTerm, getGradeDistribution: mocks.getGradeDistribution },
}));

import CourseOfferingsPanel from "@/components/course/CourseOfferingsPanel";

const reference = { deptCode: "cmpt", courseNumber: "225", deptId: 14, courseId: 3998 };
const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };

function offering(semesterCode: number, term: string, year: number, extra: Partial<CourseOffering> = {}): CourseOffering {
  return { section: "CMPT 225 D100", infoUrl: "", term, year, semesterCode, isEnrolling: false, location: "Burnaby", instructors: "Ada", enrolled: "40", capacity: "50", loadPercent: 80, ...extra };
}

const olderOffering = offering(1264, "spring", 2026, { enrolled: "45", capacity: "50", loadPercent: 90 });
const newerOffering = offering(1267, "summer", 2026, { section: "CMPT 225 D200", location: "Surrey" });

function renderPanel() {
  return render(<CourseOfferingsPanel reference={reference} department={department} course={course} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOfferings.mockResolvedValue([olderOffering, newerOffering]);
  mocks.getEnrollingTerm.mockResolvedValue({ term: "summer", year: 2026, semesterCode: 1267 });
  mocks.getGradeDistribution.mockResolvedValue({ deptCode: "CMPT", courseNumber: "225", title: "Data Structures", medianGrade: "B-", failRate: 8, distribution: {} });
});

describe("CourseOfferingsPanel", () => {
  it("renders the course heading, facts and actions", async () => {
    renderPanel();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("CMPT 225 · Data Structures");
    expect(await screen.findByText("Computing Science · 3 units · Surrey, Burnaby")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Compare" })).toHaveAttribute("href", "/compare/courses?courses=cmpt-225");
    expect(screen.getByRole("link", { name: "View trends" })).toHaveAttribute("href", "/graph/load/cmpt/225");
  });

  it("summarises grades and the average load of completed terms", async () => {
    renderPanel();
    const summary = await screen.findByText("Median grade");
    const row = summary.closest("dl") as HTMLElement;
    expect(within(row).getByText("B-")).toBeInTheDocument();
    expect(within(row).getByText("8%")).toBeInTheDocument();
    // Only Spring 2026 is completed (before the enrolling term): 45 / 50.
    expect(await within(row).findByText("90%")).toBeInTheDocument();
    expect(within(row).getByText("Avg. load, last 3 terms")).toBeInTheDocument();
  });

  it("hides grade figures when the grade request fails", async () => {
    mocks.getGradeDistribution.mockRejectedValue(new Error("offline"));
    renderPanel();
    expect(await screen.findByText("Avg. load, last 3 terms")).toBeInTheDocument();
    expect(screen.queryByText("Median grade")).not.toBeInTheDocument();
    expect(screen.queryByText("Fail rate")).not.toBeInTheDocument();
  });

  it("lists offerings newest first with keyboard-accessible term links", async () => {
    renderPanel();
    const newest = await screen.findByRole("link", { name: "Summer 2026" });
    expect(newest).toHaveAttribute("href", "/browse/cmpt/225/1267");
    // Term links read as normal text: no accent or red styling.
    const colourClasses = newest.className.split(/\s+/).filter((c) => /(^|:)(text|bg|decoration)-(accent|primary|destructive|red)/.test(c));
    expect(colourClasses).toEqual([]);
    expect(newest).toHaveClass("text-text-primary", "font-medium");
    expect(screen.getByText("2 of 2 sections")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spring 2026" })).toHaveAttribute("href", "/browse/cmpt/225/1264");
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Summer 2026");
    expect(within(rows[1]).getByText("Enrolling")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Offerings" })).toBeInTheDocument();
    expect(screen.queryByText(/Click a term row/)).not.toBeInTheDocument();
    expect(mocks.getOfferings).toHaveBeenCalledWith(14, 3998);
  });

  it("shows 12 terms first, then the rest on request", async () => {
    const user = userEvent.setup();
    mocks.getOfferings.mockResolvedValue(Array.from({ length: 15 }, (_, i) => offering(1000 + i, "fall", 2000 + i)));
    renderPanel();
    await screen.findByRole("link", { name: "Fall 2014" });
    expect(screen.getAllByRole("row")).toHaveLength(13);
    expect(screen.getByText("12 of 15 sections")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Fall 2000" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show older terms (3)" }));
    expect(screen.getAllByRole("row")).toHaveLength(16);
    expect(screen.getByText("15 of 15 sections")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show older terms/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fall 2000" })).toBeInTheDocument();
  });

  it("renders an empty state when there are no offerings", async () => {
    mocks.getOfferings.mockResolvedValue([]);
    renderPanel();
    expect(await screen.findByRole("heading", { name: "No offerings found." })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows a loading skeleton, then retries a failed request without changing the route", async () => {
    const user = userEvent.setup();
    mocks.getOfferings.mockRejectedValueOnce(new Error("offline"));
    renderPanel();
    expect(screen.getByRole("status")).toHaveTextContent("Loading offerings");
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load course offerings.");

    await user.click(screen.getByRole("button", { name: "Try Again" }));
    await waitFor(() => expect(mocks.getOfferings).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("link", { name: "Summer 2026" })).toBeInTheDocument();
  });
});
