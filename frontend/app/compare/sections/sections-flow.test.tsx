import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(), replace: vi.fn(), search: new URLSearchParams(),
  params: { deptCode: "cmpt", courseNumber: "225", semesterCode: "1267" },
  route: { status: "resolved" as string, course: null as Record<string, unknown> | null },
  getDepartments: vi.fn(), getCourses: vi.fn(), getEnrollingTerm: vi.fn(), resolveCourseIds: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  useSearchParams: () => mocks.search,
  useParams: () => mocks.params,
}));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/api", () => ({ api: { getDepartments: mocks.getDepartments, getCourses: mocks.getCourses, getEnrollingTerm: mocks.getEnrollingTerm } }));
vi.mock("@/lib/course-resolver", () => ({ resolveCourseIds: mocks.resolveCourseIds }));
vi.mock("@/hooks/useCourseRouteResolution", () => ({ useCourseRouteResolution: () => mocks.route }));
vi.mock("@/components/course/SectionComparisonResults", () => ({
  default: ({ semesterCode, requestedSections }: { semesterCode: number; requestedSections: string[] }) => (
    <div>Results for {semesterCode} with {requestedSections.join(",") || "none"}</div>
  ),
}));

import SectionComparisonPage from "@/app/compare/sections/page";
import CanonicalSectionComparisonPage from "@/app/compare/sections/[deptCode]/[courseNumber]/[semesterCode]/page";

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };
const resolved = { deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225", department, course };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.search = new URLSearchParams();
  mocks.params = { deptCode: "cmpt", courseNumber: "225", semesterCode: "1267" };
  mocks.route = { status: "resolved", course: resolved };
  mocks.getDepartments.mockResolvedValue([department]);
  mocks.getCourses.mockResolvedValue([course]);
  mocks.getEnrollingTerm.mockResolvedValue({ year: 2026, term: "summer", semesterCode: 1267 });
  mocks.resolveCourseIds.mockResolvedValue(resolved);
});

describe("section comparison start page", () => {
  it("shows the Sections tab, the picker and only the course-and-term empty state", async () => {
    render(<SectionComparisonPage />);
    expect(screen.getByRole("tab", { name: "Sections" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Courses" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Pick a course and term, then the sections you're choosing between.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Choose a course and term." })).toBeInTheDocument();
    expect(screen.queryByText(/Select at least two sections/)).not.toBeInTheDocument();
    await screen.findByRole("option", { name: "Computing Science" });
  });

  it("turns a department/course/term selection into the canonical comparison URL", async () => {
    const user = userEvent.setup();
    render(<SectionComparisonPage />);
    await waitFor(() => expect(screen.getByLabelText("Department")).toBeEnabled());
    await user.selectOptions(screen.getByLabelText("Department"), "14");
    await waitFor(() => expect(screen.getByLabelText("Course")).toBeEnabled());
    await user.selectOptions(screen.getByLabelText("Course"), "3998");
    expect(screen.getByLabelText("Term")).toHaveValue("1267");
    await user.selectOptions(screen.getByLabelText("Term"), "1264");
    await user.click(screen.getByRole("button", { name: "Show sections" }));
    expect(mocks.push).toHaveBeenCalledWith("/compare/sections/cmpt/225/1264");
  });

  it("rewrites a valid numeric legacy comparison link and displays invalid ones safely", async () => {
    mocks.search = new URLSearchParams("deptId=14&courseId=3998&semester=1267&sections=cmpt%20225%20d100");
    render(<SectionComparisonPage />);
    await waitFor(() => expect(mocks.resolveCourseIds).toHaveBeenCalledWith(14, 3998));
    expect(mocks.replace).toHaveBeenCalledWith("/compare/sections/cmpt/225/1267?sections=D100");

    mocks.search = new URLSearchParams("deptId=nope&courseId=3998&semester=1267");
    render(<SectionComparisonPage />);
    expect(screen.getAllByRole("alert").at(-1)).toHaveTextContent("This section comparison link is invalid.");
    // The first render (valid link) still shows its empty state; the invalid one shows only the error.
    expect(screen.getAllByRole("heading", { name: "Choose a course and term." })).toHaveLength(1);
  });
});

describe("canonical section comparison page", () => {
  it("prefills the picker with the course and term and passes the requested sections on", async () => {
    mocks.search = new URLSearchParams("sections=D100,D200");
    render(<CanonicalSectionComparisonPage />);
    expect(screen.getByText("Results for 1267 with D100,D200")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sections" })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(screen.getByLabelText("Course")).toHaveValue("3998"));
    expect(screen.getByLabelText("Department")).toHaveValue("14");
    expect(screen.getByLabelText("Term")).toHaveValue("1267");
  });

  it("reports unknown courses", () => {
    mocks.route = { status: "notFound", course: null };
    render(<CanonicalSectionComparisonPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("This course could not be found.");
  });
});
