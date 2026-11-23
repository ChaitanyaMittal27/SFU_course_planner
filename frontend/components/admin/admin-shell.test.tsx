import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pathname: "/admin/users",
  getAdminSupport: vi.fn(),
  getAdminRmpReports: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { email: "admin@test.com" } }),
}));

vi.mock("@/lib/api", () => ({ api: { getAdminSupport: mocks.getAdminSupport, getAdminRmpReports: mocks.getAdminRmpReports } }));

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import { healthServicePresentation } from "@/components/admin/health-services";
import AdminLayout from "@/app/admin/layout";

describe("admin shell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pathname = "/admin/users";
    mocks.getAdminSupport.mockResolvedValue({ stats: { totalSubmissions: 5, unreadCount: 3, archivedCount: 0 }, submissions: [] });
    mocks.getAdminRmpReports.mockResolvedValue([{ lookupId: 1 }, { lookupId: 2 }]);
  });

  it("renders the centralized navigation with the current route marked active", async () => {
    render(<AdminSidebar />);

    const nav = screen.getByRole("navigation", { name: "Admin navigation" });
    expect(within(nav).getByText("Operations")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Users" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
    expect(screen.getAllByText("Administration")).toHaveLength(2); // desktop sidebar + mobile header
    expect(screen.getByText("admin@test.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to site" })).toHaveAttribute("href", "/");
    await waitFor(() => expect(mocks.getAdminSupport).toHaveBeenCalled());
  });

  it("shows unread support and open RMP counts as badges", async () => {
    render(<AdminSidebar />);
    const nav = screen.getByRole("navigation", { name: "Admin navigation" });
    expect(await within(nav).findByLabelText("3 open")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: /Support/ })).toHaveTextContent("3");
    expect(within(nav).getByRole("link", { name: /RMP Reports/ })).toHaveTextContent("2");
  });

  it("shows no badge when a count fails to load", async () => {
    mocks.getAdminSupport.mockRejectedValue(new Error("offline"));
    render(<AdminSidebar />);
    const nav = screen.getByRole("navigation", { name: "Admin navigation" });
    await within(nav).findByLabelText("2 open");
    expect(within(nav).queryByLabelText("3 open")).not.toBeInTheDocument();
  });

  it("opens mobile navigation in a sheet and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(<AdminSidebar />);

    await user.click(screen.getByRole("button", { name: "Open admin navigation" }));
    const sheet = await screen.findByRole("dialog", { name: "Admin navigation" });
    expect(within(sheet).getByRole("link", { name: "Users" })).toHaveAttribute("aria-current", "page");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Admin navigation" })).not.toBeInTheDocument());
  });

  it("keeps the sidebar out of the unauthorized route while retaining it for admin routes", () => {
    const { rerender } = render(<AdminLayout><p>Unauthorized content</p></AdminLayout>);
    expect(screen.getAllByText("Course Planner")).not.toHaveLength(0);
    expect(document.querySelector("main")).toBeNull();

    mocks.pathname = "/admin/unauthorized";
    rerender(<AdminLayout><p>Unauthorized content</p></AdminLayout>);
    expect(screen.queryAllByText("Course Planner")).toHaveLength(0);
    expect(screen.getByText("Unauthorized content")).toBeInTheDocument();
  });

  it("renders a loading skeleton announced as a single status", () => {
    render(<AdminPageSkeleton statCards={3} hasTable tableRows={4} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("uses friendly health labels and a safe fallback", () => {
    expect(healthServicePresentation("coursesys").label).toBe("CourseSys");
    expect(healthServicePresentation("custom-service").label).toBe("custom-service");
  });
});
