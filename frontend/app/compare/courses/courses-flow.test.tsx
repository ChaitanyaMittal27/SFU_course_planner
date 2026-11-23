import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  param: null as string | null,
  setCoursesParam: vi.fn(),
  getDepartments: vi.fn(),
  getCourses: vi.fn(),
  getEnrollingTerm: vi.fn(),
  getOfferings: vi.fn(),
  getGradeDistribution: vi.fn(),
  resolveCourseIdentity: vi.fn(),
  resolveCourseIds: vi.fn(),
}));
vi.mock("nuqs", async () => {
  const React = await import("react");
  return {
    useQueryState: () => {
      const [value, setValue] = React.useState<string | null>(mocks.param);
      return [value, (next: string | null) => { mocks.setCoursesParam(next); setValue(next); }];
    },
  };
});
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/api", () => ({
  api: {
    getDepartments: mocks.getDepartments, getCourses: mocks.getCourses, getEnrollingTerm: mocks.getEnrollingTerm,
    getOfferings: mocks.getOfferings, getGradeDistribution: mocks.getGradeDistribution,
  },
}));
vi.mock("@/lib/course-resolver", () => ({ resolveCourseIdentity: mocks.resolveCourseIdentity, resolveCourseIds: mocks.resolveCourseIds }));
vi.mock("@/components/analytics/GradeHistogram", () => ({ default: ({ medianGrade }: { medianGrade: string }) => <div>Grade chart, median {medianGrade}</div> }));

import CourseComparisonPage from "@/app/compare/courses/page";

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
function course(courseId: number, courseNumber: string, title: string) {
  return { courseId, deptId: 14, courseNumber, title, description: null, units: 3, degreeLevel: "UGRD", prerequisites: courseNumber === "225" ? "CMPT 125" : null, corequisites: null, designation: null };
}
const courses = [course(3998, "225", "Data Structures"), course(4000, "213", "Object-Oriented Design"), course(4001, "276", "Software Engineering"), course(4002, "300", "Operating Systems")];
const resolve = (c: ReturnType<typeof course>) => ({ deptId: 14, courseId: c.courseId, deptCode: "cmpt", courseNumber: c.courseNumber, department, course: c });

function offering(semesterCode: number, enrolled: number) {
  return { section: "D100", infoUrl: "", term: "fall", year: 2026, semesterCode, isEnrolling: false, location: "Burnaby", instructors: "", enrolled: String(enrolled), capacity: "100", loadPercent: enrolled };
}

async function addCourse(user: ReturnType<typeof userEvent.setup>, courseId: string) {
  await waitFor(() => expect(screen.getByLabelText("Department")).toBeEnabled());
  if ((screen.getByLabelText("Department") as HTMLSelectElement).value !== "14") {
    await user.selectOptions(screen.getByLabelText("Department"), "14");
  }
  await waitFor(() => expect(screen.getByLabelText("Course")).toBeEnabled());
  await user.selectOptions(screen.getByLabelText("Course"), courseId);
  await user.click(screen.getByRole("button", { name: "Add" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.param = null;
  mocks.getDepartments.mockResolvedValue([department]);
  mocks.getCourses.mockResolvedValue(courses);
  mocks.getEnrollingTerm.mockResolvedValue({ term: "spring", year: 2027, semesterCode: 1271 });
  mocks.getOfferings.mockImplementation((_deptId: number, courseId: number) =>
    Promise.resolve(courseId === 3998 ? [offering(1267, 90), offering(1264, 80)] : [offering(1267, 50)]),
  );
  mocks.getGradeDistribution.mockImplementation((courseId: number) =>
    Promise.resolve(courseId === 3998
      ? { medianGrade: "B-", failRate: 8, distribution: { B: 5 } }
      : { medianGrade: "B", failRate: 6, distribution: { B: 5 } }),
  );
  mocks.resolveCourseIdentity.mockImplementation(({ courseNumber }: { courseNumber: string }) =>
    Promise.resolve(resolve(courses.find((c) => c.courseNumber === courseNumber)!)),
  );
});

describe("Compare courses", () => {
  it("shows only the department error and restores guidance after retry", async () => {
    const user = userEvent.setup();
    mocks.getDepartments.mockRejectedValueOnce(new Error("offline"));
    render(<CourseComparisonPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load departments");
    expect(screen.queryByRole("heading", { name: "Add at least two courses to compare them." })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("option", { name: "Computing Science" });
    expect(screen.getByRole("heading", { name: "Add at least two courses to compare them." })).toBeInTheDocument();
  });

  it("shows the Compare header and URL-driven tabs", async () => {
    render(<CourseComparisonPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Compare" })).toBeInTheDocument();
    expect(screen.getByText("Up to three courses side by side.")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Courses" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Courses" })).toHaveAttribute("href", "/compare/courses");
    expect(screen.getByRole("tab", { name: "Sections" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Sections" })).toHaveAttribute("href", "/compare/sections");
    await screen.findByRole("option", { name: "Computing Science" });
  });

  it("adds courses as readable URL identities and asks for a second course", async () => {
    const user = userEvent.setup();
    render(<CourseComparisonPage />);
    expect(screen.getByRole("heading", { name: "Add at least two courses to compare them." })).toBeInTheDocument();

    await addCourse(user, "3998");
    expect(mocks.setCoursesParam).toHaveBeenLastCalledWith("cmpt-225");
    expect(screen.getByRole("button", { name: "Remove CMPT 225" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add at least two courses to compare them." })).toBeInTheDocument();
    expect(mocks.getOfferings).not.toHaveBeenCalled();
  });

  it("shows validation as an inline status line, not an alert", async () => {
    const user = userEvent.setup();
    mocks.param = "cmpt-225,cmpt-213,cmpt-276";
    render(<CourseComparisonPage />);
    await screen.findByRole("button", { name: "Remove CMPT 276" });

    await addCourse(user, "3998");
    expect(screen.getByRole("status")).toHaveTextContent("CMPT 225 is already in the comparison.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Course"), "4002");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("status")).toHaveTextContent("You can compare up to 3 courses. Remove one to add CMPT 300.");
    expect(screen.getByRole("status")).toHaveClass("text-warning-text");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("loads the comparison automatically once two courses are picked and highlights the best values", async () => {
    const user = userEvent.setup();
    render(<CourseComparisonPage />);
    await addCourse(user, "3998");
    await addCourse(user, "4000");

    expect(screen.queryByRole("button", { name: /Compare \d Courses/ })).not.toBeInTheDocument();
    expect(mocks.setCoursesParam).toHaveBeenLastCalledWith("cmpt-225,cmpt-213");
    const card = (await screen.findByRole("heading", { level: 2, name: "Comparison" })).closest("section") as HTMLElement;
    expect(card).toHaveTextContent("Best value in each row in green");
    expect(screen.queryByRole("heading", { name: "Add at least two courses to compare them." })).not.toBeInTheDocument();

    const table = await within(card).findByRole("table");
    const headers = within(table).getAllByRole("columnheader");
    expect(headers[1]).toHaveTextContent("CMPT 225Data Structures");
    expect(within(headers[1]).getByRole("link", { name: "CMPT 225" })).toHaveAttribute("href", "/browse/cmpt/225");

    const row = (label: string) => within(table).getByRole("rowheader", { name: label }).closest("tr") as HTMLElement;
    expect(within(row("Median grade")).getByText("B")).toHaveClass("text-success-text", "font-semibold");
    expect(within(row("Median grade")).getByText("B-")).not.toHaveClass("text-success-text");
    expect(within(row("Fail rate")).getByText("6%")).toHaveClass("text-success-text");
    expect(within(row("Avg. load, last 3 terms")).getByText("50%")).toHaveClass("text-success-text");
    expect(row("Offered")).toHaveTextContent("2 of last 6 terms");
    expect(row("Prerequisites")).toHaveTextContent("CMPT 125");

    const grades = screen.getByRole("heading", { level: 2, name: "Grade distributions" }).closest("section") as HTMLElement;
    expect(within(grades).getByText("Grade chart, median B-")).toBeInTheDocument();
    expect(within(grades).getByText("Median B")).toBeInTheDocument();
  });

  it("retries a failed comparison request", async () => {
    const user = userEvent.setup();
    mocks.param = "cmpt-225,cmpt-213";
    mocks.getOfferings.mockRejectedValueOnce(new Error("offline"));
    render(<CourseComparisonPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load the comparison");

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Comparison" })).toBeInTheDocument();
  });

  it("removes a course with its chip button", async () => {
    const user = userEvent.setup();
    mocks.param = "cmpt-225,cmpt-213";
    render(<CourseComparisonPage />);
    await user.click(await screen.findByRole("button", { name: "Remove CMPT 213" }));
    expect(mocks.setCoursesParam).toHaveBeenLastCalledWith("cmpt-225");
    expect(screen.getByRole("heading", { name: "Add at least two courses to compare them." })).toBeInTheDocument();
  });
});
