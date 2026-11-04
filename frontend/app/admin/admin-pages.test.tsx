import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getHealthStatus: vi.fn(),
  getServiceHealth: vi.fn(),
  getAdminTerms: vi.fn(),
  updateTerms: vi.fn(),
  getAdminUsers: vi.fn(),
  getAdminBookmarks: vi.fn(),
  getAdminSupport: vi.fn(),
  getAdminRmpReports: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api: apiMocks }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/hooks/useScrollReveal", () => ({ useScrollReveal: () => vi.fn() }));
vi.mock("recharts", () => ({
  CartesianGrid: () => null,
  Line: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

import AdminDashboardPage from "@/app/admin/page";
import AdminHealthPage from "@/app/admin/health/page";
import AdminTermsPage from "@/app/admin/terms/page";
import AdminUsersPage from "@/app/admin/users/page";
import AdminBookmarksPage from "@/app/admin/bookmarks/page";
import AdminSupportPage from "@/app/admin/support/page";

const terms = [
  { termId: 1, year: 2026, term: "spring", isCurrent: true, isEnrolling: false, updatedAt: null },
  { termId: 2, year: 2026, term: "summer", isCurrent: false, isEnrolling: true, updatedAt: null },
];

beforeEach(() => {
  vi.clearAllMocks();
  apiMocks.getHealthStatus.mockResolvedValue([{ service: "api", status: "up", latencyMs: 0, url: "http://api.test" }]);
  apiMocks.getServiceHealth.mockResolvedValue([{ service: "api", status: "up", latencyMs: 8, url: "http://api.test" }]);
  apiMocks.getAdminTerms.mockResolvedValue(terms);
  apiMocks.updateTerms.mockResolvedValue(terms);
  apiMocks.getAdminUsers.mockResolvedValue({
    stats: { totalUsers: 2, newThisMonth: 1, optedInNotifications: 1, activeInLast30Days: 2, providerGoogle: 1, providerEmail: 1 },
    users: [{ id: "user-1", email: "student@example.com", createdAt: "2026-08-01T00:00:00Z", lastSignInAt: null, provider: "email", displayName: null, emailVerified: true, isAnonymous: false, emailNotificationsEnabled: true, preferredEmail: "student@example.com", lastNotifiedAt: null, bookmarkCount: 2 }],
  });
  apiMocks.getAdminBookmarks.mockResolvedValue({
    stats: { totalBookmarks: 0, avgPerUser: 0, topDepartment: "—", topDepartmentName: "", uniqueCourses: 0 },
    topCourses: [], departmentRankings: [], monthlyGrowth: [],
  });
  apiMocks.getAdminSupport.mockResolvedValue({ stats: { totalSubmissions: 0, unreadCount: 0, archivedCount: 0 }, submissions: [] });
  apiMocks.getAdminRmpReports.mockResolvedValue([{ lookupId: 7, openReports: 2 }]);
});

describe("admin pages", () => {
  it("renders the overview from independent operational requests", async () => {
    render(<AdminDashboardPage />);

    expect(await screen.findByRole("heading", { name: "Admin overview" })).toBeInTheDocument();
    expect(screen.getByText("2 registered")).toBeInTheDocument();
    expect(screen.getByText("1 services up")).toBeInTheDocument();
    expect(screen.getByText("All caught up")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RMP Reports" })).toBeInTheDocument();
    expect(screen.getByText("1 to review")).toBeInTheDocument();
    expect(apiMocks.getAdminBookmarks).toHaveBeenCalledOnce();
  });

  it("renders health checks and rechecks an individual service", async () => {
    const user = userEvent.setup();
    render(<AdminHealthPage />);

    expect(await screen.findByRole("heading", { name: "System health" })).toBeInTheDocument();
    expect(screen.getByText("Operational")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Recheck" }));
    await waitFor(() => expect(apiMocks.getServiceHealth).toHaveBeenCalledWith("api"));
    expect(screen.getByText("8ms")).toBeInTheDocument();
  });

  it("shows term data and validates an invalid term update locally", async () => {
    const user = userEvent.setup();
    render(<AdminTermsPage />);

    expect((await screen.findAllByText("Summer 2026")).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Update terms" }));
    await user.selectOptions(screen.getByLabelText("Enrolling term"), "spring");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Current and enrolling terms cannot be the same.");
    expect(apiMocks.updateTerms).not.toHaveBeenCalled();
  });

  it("renders empty analytics states for users, bookmarks, and support", async () => {
    apiMocks.getAdminUsers.mockResolvedValueOnce({
      stats: { totalUsers: 0, newThisMonth: 0, optedInNotifications: 0, activeInLast30Days: 0, providerGoogle: 0, providerEmail: 0 },
      users: [],
    });
    const usersView = render(<AdminUsersPage />);
    expect(await screen.findByText("No registered users found.")).toBeInTheDocument();
    usersView.unmount();

    const bookmarksView = render(<AdminBookmarksPage />);
    expect(await screen.findByText("No bookmarks found.")).toBeInTheDocument();
    expect(screen.getByText("No department ranking data found.")).toBeInTheDocument();
    bookmarksView.unmount();

    render(<AdminSupportPage />);
    expect(await screen.findByText("No submissions yet")).toBeInTheDocument();
  });
});
