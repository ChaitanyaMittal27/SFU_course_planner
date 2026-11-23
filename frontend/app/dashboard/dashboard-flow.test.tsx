import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  auth: { user: null as Record<string, unknown> | null, isAuthenticated: false, isLoading: false, signOut: vi.fn() },
  getDepartments: vi.fn(),
  getBookmarks: vi.fn(),
  getBookmarkOfferings: vi.fn(),
  getUserPreferences: vi.fn(),
  getCourses: vi.fn(),
  deleteBookmark: vi.fn(),
  updateEmailNotificationPreference: vi.fn(),
  updatePreferredEmail: vi.fn(),
  updateUser: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: { updateUser: mocks.updateUser } } }));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));
vi.mock("@/lib/api", () => ({
  api: {
    getDepartments: mocks.getDepartments, getBookmarks: mocks.getBookmarks, getBookmarkOfferings: mocks.getBookmarkOfferings,
    getUserPreferences: mocks.getUserPreferences, getCourses: mocks.getCourses, deleteBookmark: mocks.deleteBookmark,
    updateEmailNotificationPreference: mocks.updateEmailNotificationPreference, updatePreferredEmail: mocks.updatePreferredEmail,
  },
}));

import DashboardPage from "@/app/dashboard/page";

const signedIn = { user: { id: "user-1", email: "student@example.com", user_metadata: {}, app_metadata: { provider: "google" } }, isAuthenticated: true, isLoading: false };
const bookmark = { bookmarkId: 1, deptId: 14, courseId: 3998, semesterCode: 1267, section: "D100", createdAt: "2026-01-01" };
const offering = { bookmarkId: 1, deptId: 14, courseId: 3998, semesterCode: 1267, section: "D100", term: "summer", year: 2026, infoUrl: "", isEnrolling: true, location: "Burnaby", instructors: "Ada", enrolled: "40", capacity: "45", loadPercent: 92 };

function withBookmark() {
  mocks.auth = { ...signedIn, signOut: mocks.auth.signOut };
  mocks.getBookmarks.mockResolvedValue([bookmark]);
  mocks.getBookmarkOfferings.mockResolvedValue([offering]);
  mocks.getCourses.mockResolvedValue([{ courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures" }]);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth = { user: null, isAuthenticated: false, isLoading: false, signOut: vi.fn() };
  mocks.getDepartments.mockResolvedValue([{ deptId: 14, deptCode: "CMPT", name: "Computing Science" }]);
  mocks.getBookmarks.mockResolvedValue([]);
  mocks.getBookmarkOfferings.mockResolvedValue([]);
  mocks.getUserPreferences.mockResolvedValue({ emailNotificationsEnabled: false, userEmail: null });
  mocks.getCourses.mockResolvedValue([]);
  mocks.deleteBookmark.mockResolvedValue(undefined);
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.updateEmailNotificationPreference.mockResolvedValue({ emailNotificationsEnabled: true, userEmail: null });
});

describe("dashboard flow", () => {
  it("keeps unauthenticated users out of protected dashboard data", () => {
    render(<DashboardPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Your session could not be restored in this tab.");
    expect(screen.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/login?redirectTo=%2Fdashboard");
    expect(mocks.getBookmarks).not.toHaveBeenCalled();
  });

  it("shows the authenticated empty watchlist with a Browse call to action", async () => {
    mocks.auth = { ...signedIn, signOut: vi.fn() };
    render(<DashboardPage />);
    expect(await screen.findByRole("heading", { name: "No watchers yet" })).toBeInTheDocument();
    // Header action and empty-state action.
    const browseLinks = screen.getAllByRole("link", { name: "Browse courses" });
    expect(browseLinks).toHaveLength(2);
    for (const link of browseLinks) expect(link).toHaveAttribute("href", "/browse");
  });

  it("summarises bookmarks and links each row to its canonical offering", async () => {
    withBookmark();
    render(<DashboardPage />);
    expect(await screen.findByText("Data Structures")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CMPT 225" })).toHaveAttribute("href", "/browse/cmpt/225/1267");

    const summary = screen.getByText("Watching").closest("dl") as HTMLElement;
    const values = within(summary).getAllByRole("definition").map((d) => d.textContent);
    expect(values).toEqual(["1", "0", "88%", "Off"]);
    expect(screen.getByRole("heading", { level: 2, name: "Bookmarks" }).closest("section")).toHaveTextContent("Included in your morning email");
  });

  it("asks before removing a bookmark, then removes it", async () => {
    const user = userEvent.setup();
    withBookmark();
    render(<DashboardPage />);
    await user.click(await screen.findByRole("button", { name: "Remove CMPT 225 D100" }));

    const dialog = await screen.findByRole("alertdialog", { name: "Remove CMPT 225 D100 from your bookmarks?" });
    expect(mocks.deleteBookmark).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mocks.deleteBookmark).toHaveBeenCalledWith(1));
    expect(await screen.findByRole("heading", { name: "No watchers yet" })).toBeInTheDocument();
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Removed CMPT 225 D100 from your bookmarks.");
  });

  it("keeps the bookmark when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    withBookmark();
    render(<DashboardPage />);
    await user.click(await screen.findByRole("button", { name: "Remove CMPT 225 D100" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(mocks.deleteBookmark).not.toHaveBeenCalled();
    expect(screen.getByText("Data Structures")).toBeInTheDocument();
  });

  it("reports failures as toasts instead of alerts or console-only errors", async () => {
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert");
    withBookmark();
    mocks.deleteBookmark.mockRejectedValue(new Error("network down"));
    mocks.updateUser.mockResolvedValue({ error: new Error("name rejected") });
    render(<DashboardPage />);

    await user.click(await screen.findByRole("button", { name: "Remove CMPT 225 D100" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Couldn't remove CMPT 225 D100: network down"));
    expect(screen.getByText("Data Structures")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit display name" }));
    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "Ada");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Couldn't update your display name: name rejected"));
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it("says so, with a working retry, when course details fail to load", async () => {
    withBookmark();
    mocks.getCourses.mockRejectedValueOnce(new Error("offline"));
    render(<DashboardPage />);

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Couldn't load some course details.", expect.objectContaining({ action: expect.any(Object) })),
    );
    const [, options] = mocks.toastError.mock.calls[0];
    expect(options.action.label).toBe("Try again");
    options.action.onClick();
    expect(await screen.findByText("Data Structures")).toBeInTheDocument();
    expect(mocks.getCourses).toHaveBeenCalledTimes(2);
  });

  it("toggles the labelled morning email switch and confirms with a toast", async () => {
    const user = userEvent.setup();
    mocks.auth = { ...signedIn, signOut: vi.fn() };
    render(<DashboardPage />);
    const toggle = await screen.findByRole("switch", { name: "Morning email" });
    await waitFor(() => expect(mocks.getUserPreferences).toHaveBeenCalled());
    await user.click(toggle);
    await waitFor(() => expect(mocks.updateEmailNotificationPreference).toHaveBeenCalledWith(true));
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Morning email turned on.");
  });
});
