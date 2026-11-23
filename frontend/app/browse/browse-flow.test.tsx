import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), params: { deptCode: "cmpt", courseNumber: "225", semesterCode: "1267", deptId: "14", courseId: "3998" }, getDepartments: vi.fn(), getCourses: vi.fn(), getOfferingDetail: vi.fn(), resolveCourseIds: vi.fn(), route: { status: "resolved" as string, course: null as Record<string, unknown> | null } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, replace: mocks.replace }), useParams: () => mocks.params }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("nuqs", async () => { const React = await import("react"); return { useQueryState: () => React.useState<string | null>(null) }; });
vi.mock("@/lib/api", () => ({ api: { getDepartments: mocks.getDepartments, getCourses: mocks.getCourses, getOfferingDetail: mocks.getOfferingDetail } }));
vi.mock("@/lib/course-resolver", () => ({ resolveCourseIds: mocks.resolveCourseIds }));
vi.mock("@/hooks/useCourseRouteResolution", () => ({ useCourseRouteResolution: () => mocks.route }));
vi.mock("@/components/course/CourseOfferingsPanel", () => ({ default: ({ reference }: { reference: { courseId: number } }) => <div>Offerings for {reference.courseId}</div> }));
vi.mock("@/components/course/OfferingDetailScreen", () => ({ default: ({ backHref }: { backHref: string }) => <div>Detail back to {backHref}</div> }));

import BrowsePage from "@/app/browse/page";
import BrowseCoursePage from "@/app/browse/[deptCode]/[courseNumber]/page";
import CanonicalOfferingDetailPage from "@/app/browse/[deptCode]/[courseNumber]/[semesterCode]/page";
import LegacyOfferingPage from "@/app/browse/departments/[deptId]/courses/[courseId]/offerings/[semesterCode]/page";

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures and Programming", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };
const otherCourse = { ...course, courseId: 4000, courseNumber: "276", title: "Introduction to Software Engineering" };
const resolved = { deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225", department, course };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = { deptCode: "cmpt", courseNumber: "225", semesterCode: "1267", deptId: "14", courseId: "3998" };
  mocks.route = { status: "resolved", course: resolved };
  mocks.getDepartments.mockResolvedValue([department]);
  mocks.getCourses.mockResolvedValue([otherCourse, course]);
  mocks.getOfferingDetail.mockResolvedValue({ title: "Data Structures" });
  mocks.resolveCourseIds.mockResolvedValue(resolved);
});

describe("Browse page", () => {
  it("renders the page header and no raw select tooltip", async () => {
    render(<BrowsePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Browse courses" })).toBeInTheDocument();
    expect(screen.getByText("Search by course code, or pick a department.")).toBeInTheDocument();
    expect(await screen.findByLabelText("Department")).not.toHaveAttribute("title");
  });

  it("picks a department and course, then opens the readable course URL", async () => {
    const user = userEvent.setup();
    render(<BrowsePage />);
    await waitFor(() => expect(screen.getByLabelText("Department")).toBeEnabled());
    await user.selectOptions(screen.getByLabelText("Department"), "14");
    await waitFor(() => expect(mocks.getCourses).toHaveBeenCalledWith(14));
    await waitFor(() => expect(screen.getByLabelText("Course")).toBeEnabled());
    expect(screen.getByRole("button", { name: "View offerings" })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("Course"), "3998");
    await user.click(screen.getByRole("button", { name: "View offerings" }));
    expect(mocks.push).toHaveBeenCalledWith("/browse/cmpt/225");
  });

  it("searches by a forgiving course code and opens the highlighted result with Enter", async () => {
    const user = userEvent.setup();
    render(<BrowsePage />);
    const input = await screen.findByRole("combobox", { name: "Find a course" });
    await waitFor(() => expect(input).toBeEnabled());

    await user.type(input, "cmpt225");
    const option = await screen.findByRole("option", { name: /CMPT 225/ });
    expect(option).toHaveTextContent("Data Structures and Programming");
    expect(option).toHaveTextContent("Computing Science");
    expect(screen.queryByRole("option", { name: /CMPT 276/ })).not.toBeInTheDocument();
    expect(mocks.getCourses).toHaveBeenCalledTimes(1);

    await user.keyboard("{Enter}");
    expect(mocks.push).toHaveBeenCalledWith("/browse/cmpt/225");
  });

  it("suggests the department for a typo and moves through results with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<BrowsePage />);
    const input = await screen.findByRole("combobox", { name: "Find a course" });
    await waitFor(() => expect(input).toBeEnabled());

    await user.type(input, "cmtp 2");
    expect(await screen.findByText(/Did you mean/)).toHaveTextContent("Did you mean CMPT?");
    const options = await within(await screen.findByRole("listbox")).findAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([expect.stringContaining("CMPT 225"), expect.stringContaining("CMPT 276")]);

    await user.keyboard("{ArrowDown}{Enter}");
    expect(mocks.push).toHaveBeenCalledWith("/browse/cmpt/276");
  });

  it("explains when nothing matches and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<BrowsePage />);
    const input = await screen.findByRole("combobox", { name: "Find a course" });
    await waitFor(() => expect(input).toBeEnabled());

    await user.type(input, "zzzz 101");
    expect(await screen.findByText("No courses match. Try a course code like CMPT 225.")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("No courses match. Try a course code like CMPT 225.")).not.toBeInTheDocument());
  });

  it("retries the department request when it fails", async () => {
    const user = userEvent.setup();
    mocks.getDepartments.mockRejectedValueOnce(new Error("offline"));
    render(<BrowsePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load departments");

    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(mocks.getDepartments).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Department")).toBeEnabled();
  });

  it("retries a failed course list for the chosen department", async () => {
    const user = userEvent.setup();
    mocks.getCourses.mockRejectedValueOnce(new Error("offline"));
    render(<BrowsePage />);
    await waitFor(() => expect(screen.getByLabelText("Department")).toBeEnabled());
    await user.selectOptions(screen.getByLabelText("Department"), "14");
    expect(await screen.findByRole("alert")).toHaveTextContent("Courses for CMPT didn't load.");

    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(mocks.getCourses).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByLabelText("Course")).toBeEnabled());
  });
});

describe("Browse routes", () => {
  it("keeps readable course route outcomes explicit", () => {
    const view = render(<BrowseCoursePage />);
    expect(screen.getByText("Offerings for 3998")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("href", "/browse");
    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toHaveTextContent("CMPT 225");
    view.unmount();

    mocks.route = { status: "notFound", course: null };
    render(<BrowseCoursePage />);
    expect(screen.getByRole("alert")).toHaveTextContent("This course could not be found.");
  });

  it("loads a canonical offering internally by IDs and preserves its readable parent route", async () => {
    render(<CanonicalOfferingDetailPage />);
    await waitFor(() => expect(mocks.getOfferingDetail).toHaveBeenCalledWith(14, 3998, 1267));
    expect(await screen.findByText("Detail back to /browse/cmpt/225")).toBeInTheDocument();
  });

  it("retries a failed offering request", async () => {
    const user = userEvent.setup();
    mocks.getOfferingDetail.mockRejectedValueOnce(new Error("offline"));
    render(<CanonicalOfferingDetailPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load offering details.");

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Detail back to /browse/cmpt/225")).toBeInTheDocument();
    expect(mocks.getOfferingDetail).toHaveBeenCalledTimes(2);
  });

  it("rewrites valid legacy offering URLs once and rejects malformed legacy inputs", async () => {
    render(<LegacyOfferingPage />);
    await waitFor(() => expect(mocks.resolveCourseIds).toHaveBeenCalledWith(14, 3998));
    expect(mocks.replace).toHaveBeenCalledWith("/browse/cmpt/225/1267");

    mocks.params = { ...mocks.params, deptId: "bad" };
    render(<LegacyOfferingPage />);
    expect(screen.getAllByRole("alert").at(-1)).toHaveTextContent("This offering link is invalid.");
  });
});
