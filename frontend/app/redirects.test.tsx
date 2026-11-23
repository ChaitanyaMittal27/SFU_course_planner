import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const replace = vi.fn();
  return {
    redirect: vi.fn(),
    replace,
    search: new URLSearchParams(),
    resolveCourseIds: vi.fn(),
    // Stable like the real Next router, so effects depending on it do not re-run each render.
    router: { replace, push: vi.fn() },
  };
});
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  useRouter: () => mocks.router,
  useSearchParams: () => mocks.search,
}));
vi.mock("@/lib/course-resolver", () => ({ resolveCourseIds: mocks.resolveCourseIds }));
vi.mock("@/components/analytics/CanonicalAnalyticsPage", () => ({
  default: ({ kind }: { kind: string }) => <div>Graphs page for {kind}, no course</div>,
}));

import ComparePage from "@/app/compare/page";
import GraphPage from "@/app/graph/page";
import LoadGraphPage from "@/app/graph/load/page";
import EnrollmentGraphPage from "@/app/graph/enrollment/page";
import GradesGraphPage from "@/app/graph/grades/page";

const resolved = { deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.search = new URLSearchParams();
  mocks.resolveCourseIds.mockResolvedValue(resolved);
});

describe("hub redirects", () => {
  it("sends /compare to Compare courses and /graph to the Load graph", () => {
    ComparePage();
    expect(mocks.redirect).toHaveBeenCalledWith("/compare/courses");
    GraphPage();
    expect(mocks.redirect).toHaveBeenCalledWith("/graph/load");
  });
});

describe("query-parameter graph pages", () => {
  it("redirect a load link to the canonical route, keeping the range", async () => {
    mocks.search = new URLSearchParams("deptId=14&courseId=3998&range=3yr");
    render(<LoadGraphPage />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/graph/load/cmpt/225?range=3yr"));
    expect(mocks.resolveCourseIds).toHaveBeenCalledWith(14, 3998);
  });

  it("redirect an enrollment link without a range to the plain canonical route", async () => {
    mocks.search = new URLSearchParams("deptId=14&courseId=3998");
    render(<EnrollmentGraphPage />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/graph/enrollment/cmpt/225"));
  });

  it("drop the range for grades, as before", async () => {
    mocks.search = new URLSearchParams("deptId=14&courseId=3998&range=1yr");
    render(<GradesGraphPage />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/graph/grades/cmpt/225"));
  });

  it("show the graphs page with no course when the query has none", () => {
    render(<LoadGraphPage />);
    expect(screen.getByText("Graphs page for load, no course")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("report malformed or unknown courses instead of redirecting", async () => {
    mocks.search = new URLSearchParams("deptId=abc&courseId=3998");
    const view = render(<LoadGraphPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("This analytics link is invalid.");
    view.unmount();

    mocks.search = new URLSearchParams("deptId=14&courseId=1");
    mocks.resolveCourseIds.mockResolvedValue(null);
    render(<LoadGraphPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("This analytics link is invalid.");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("offers a working retry when resolving the link fails", async () => {
    const user = userEvent.setup();
    mocks.search = new URLSearchParams("deptId=14&courseId=3998");
    mocks.resolveCourseIds.mockRejectedValueOnce(new Error("offline"));
    render(<LoadGraphPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to resolve this analytics link.");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/graph/load/cmpt/225"));
    expect(mocks.resolveCourseIds).toHaveBeenCalledTimes(2);
  });
});
