import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  params: { deptCode: "cmpt", courseNumber: "225" } as Record<string, string>,
  range: "5yr",
  setRange: vi.fn(),
  push: vi.fn(),
  resolveCourseIdentity: vi.fn(),
  getDepartments: vi.fn(),
  getCourses: vi.fn(),
  getGradeDistribution: vi.fn(),
  getEnrollmentHistory: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useParams: () => mocks.params, useRouter: () => ({ push: mocks.push }) }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("nuqs", () => ({ useQueryState: () => [mocks.range, mocks.setRange] }));
vi.mock("@/lib/course-resolver", () => ({ resolveCourseIdentity: mocks.resolveCourseIdentity }));
vi.mock("@/lib/api", () => ({
  api: {
    getDepartments: mocks.getDepartments, getCourses: mocks.getCourses,
    getGradeDistribution: mocks.getGradeDistribution, getEnrollmentHistory: mocks.getEnrollmentHistory,
  },
}));
// Recharts draws nothing in jsdom; the charts are stubbed and the text alternatives tested instead.
vi.mock("@/components/analytics/HistoryCharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/analytics/HistoryCharts")>();
  return { ...actual, LoadChart: () => <div>Load chart</div>, EnrollmentChart: () => <div>Enrollment chart</div> };
});

import CanonicalAnalyticsPage from "@/components/analytics/CanonicalAnalyticsPage";

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };
const otherCourse = { ...course, courseId: 4000, courseNumber: "276", title: "Software Engineering" };
const resolved = { deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225", department, course };
const history = [
  { semesterCode: 1264, term: "summer", year: 2026, enrolled: 120, capacity: 120, loadPercent: 100 },
  { semesterCode: 1261, term: "spring", year: 2026, enrolled: 80, capacity: 100, loadPercent: 80 },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = { deptCode: "cmpt", courseNumber: "225" };
  mocks.range = "5yr";
  mocks.resolveCourseIdentity.mockResolvedValue(resolved);
  mocks.getDepartments.mockResolvedValue([department]);
  mocks.getCourses.mockResolvedValue([course, otherCourse]);
  mocks.getGradeDistribution.mockResolvedValue({ medianGrade: "B-", failRate: 8, distribution: { A: 30, "B-": 30, "C-": 14, D: 10, F: 16 } });
  mocks.getEnrollmentHistory.mockResolvedValue(history);
});

describe("graphs page", () => {
  it("shows the Graphs header and tabs that keep the selected course", async () => {
    mocks.range = "3yr";
    render(<CanonicalAnalyticsPage kind="load" />);
    expect(screen.getByRole("heading", { level: 1, name: "Graphs" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Load" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Load" })).toHaveAttribute("href", "/graph/load/cmpt/225?range=3yr");
    expect(screen.getByRole("tab", { name: "Enrollment" })).toHaveAttribute("href", "/graph/enrollment/cmpt/225?range=3yr");
    expect(screen.getByRole("tab", { name: "Grades" })).toHaveAttribute("href", "/graph/grades/cmpt/225");
    expect(screen.getByRole("tab", { name: "Grades" })).toHaveAttribute("aria-selected", "false");
    await screen.findByText("Load chart");
  });

  it("loads the load history for the range and summarises it with a readable data table", async () => {
    render(<CanonicalAnalyticsPage kind="load" />);
    await waitFor(() => expect(mocks.getEnrollmentHistory).toHaveBeenCalledWith(14, 3998, "5yr"));
    const card = (await screen.findByRole("heading", { level: 2, name: "CMPT 225 · Load over time" })).closest("section") as HTMLElement;
    expect(within(card).getByText("Data Structures")).toBeInTheDocument();
    expect(within(card).getByRole("list", { name: "Legend" })).toHaveTextContent("100% full");
    expect(within(card).getByText("Average load 90% over 2 terms · full in 1 of them.")).toBeInTheDocument();

    const table = within(card).getByRole("table");
    expect(within(table).getAllByRole("rowheader").map((th) => th.textContent)).toEqual(["Spring 2026", "Summer 2026"]);
    expect(table).not.toHaveTextContent("1264");
  });

  it("switches the time range with a pressed toggle", async () => {
    const user = userEvent.setup();
    render(<CanonicalAnalyticsPage kind="enrollment" />);
    const fiveYears = await screen.findByRole("button", { name: "5 years" });
    expect(fiveYears).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "1 year" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "1 year" }));
    expect(mocks.setRange).toHaveBeenCalledWith("1yr");
    expect(await screen.findByText("Capacity ranged from 100 to 120 seats between Spring 2026 and Summer 2026.")).toBeInTheDocument();
  });

  it("shows the grade distribution with its summary and no range toggle", async () => {
    render(<CanonicalAnalyticsPage kind="grades" />);
    await waitFor(() => expect(mocks.getGradeDistribution).toHaveBeenCalledWith(3998));
    expect(await screen.findByText("Median B- · fail rate 8% · 74% of students get C- or better.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Grade distribution/ })).toBeInTheDocument();
    expect(screen.getAllByText(/Median B-/)).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "5 years" })).not.toBeInTheDocument();
  });

  it("opens another course from the pickers", async () => {
    const user = userEvent.setup();
    render(<CanonicalAnalyticsPage kind="grades" />);
    await waitFor(() => expect(screen.getByLabelText("Course")).toHaveValue("3998"));
    await user.selectOptions(screen.getByLabelText("Course"), "4000");
    expect(mocks.push).toHaveBeenCalledWith("/graph/grades/cmpt/276");
  });

  it("asks for a course when none is in the URL", async () => {
    mocks.params = {};
    render(<CanonicalAnalyticsPage kind="load" />);
    expect(screen.getByRole("heading", { name: "Pick a course to see its history." })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Enrollment" })).toHaveAttribute("href", "/graph/enrollment");
    expect(mocks.resolveCourseIdentity).not.toHaveBeenCalled();
    await screen.findByRole("option", { name: "Computing Science" });
  });

  it("reports bad routes and retries failed chart data", async () => {
    const user = userEvent.setup();
    mocks.params = { deptCode: "?", courseNumber: "1" };
    const view = render(<CanonicalAnalyticsPage kind="grades" />);
    expect(screen.getByRole("alert")).toHaveTextContent("This analytics link is invalid.");
    view.unmount();

    mocks.params = { deptCode: "cmpt", courseNumber: "225" };
    mocks.getEnrollmentHistory.mockRejectedValueOnce(new Error("offline"));
    render(<CanonicalAnalyticsPage kind="load" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("The load data for CMPT 225 didn't load.");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Load chart")).toBeInTheDocument();
  });
});
