import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getBookmarks: vi.fn(),
  createBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  auth: { user: null as { id: string } | null, isLoading: false },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));
vi.mock("@/lib/api", () => ({
  api: { getBookmarks: mocks.getBookmarks, createBookmark: mocks.createBookmark, deleteBookmark: mocks.deleteBookmark },
}));

import BookmarkButton from "@/components/course/BookmarkButton";
import { useSectionBookmarks } from "@/hooks/useSectionBookmarks";

const d100 = { deptId: 14, courseId: 3998, semesterCode: 1267, section: "CMPT 225 D100" };
const d200 = { ...d100, section: "CMPT 225 D200" };

/** A page with one shared bookmark list, like OfferingDetailScreen. */
function Page({ onBookmarkChange }: { onBookmarkChange?: () => void }) {
  const bookmarks = useSectionBookmarks();
  return (
    <>
      <BookmarkButton bookmarks={bookmarks} label="CMPT 225 D100" onBookmarkChange={onBookmarkChange} {...d100} />
      <BookmarkButton bookmarks={bookmarks} label="CMPT 225 D200" {...d200} />
    </>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.user = null;
  mocks.auth.isLoading = false;
  mocks.getBookmarks.mockResolvedValue([]);
  mocks.createBookmark.mockResolvedValue({ bookmarkId: 1, ...d100, createdAt: "2026-11-01T00:00:00Z" });
  mocks.deleteBookmark.mockResolvedValue(undefined);
  window.history.replaceState({}, "", "/browse/cmpt/225/1267?tab=sections");
});

describe("BookmarkButton", () => {
  it("waits for auth, then sends anonymous users to the centralized login return path", async () => {
    const user = userEvent.setup();
    mocks.auth.isLoading = true;
    const { rerender } = render(<Page />);
    expect(screen.getAllByRole("button", { name: "Bookmark" })[0]).toBeDisabled();

    mocks.auth.isLoading = false;
    rerender(<Page />);
    const [first] = screen.getAllByRole("button", { name: "Bookmark" });
    expect(first).toBeEnabled();
    expect(first).not.toHaveAttribute("aria-pressed");
    await user.click(first);
    expect(mocks.push).toHaveBeenCalledWith("/login?redirectTo=%2Fbrowse%2Fcmpt%2F225%2F1267%3Ftab%3Dsections");
    expect(mocks.getBookmarks).not.toHaveBeenCalled();
  });

  it("fetches the user's bookmarks once for the whole page and marks existing ones", async () => {
    mocks.auth.user = { id: "user-1" };
    mocks.getBookmarks.mockResolvedValue([{ bookmarkId: 4, createdAt: "", ...d200 }]);
    render(<Page />);

    const bookmarked = await screen.findByRole("button", { name: "Bookmarked" });
    expect(bookmarked).toHaveAttribute("aria-pressed", "true");
    expect(bookmarked).toBeEnabled();
    expect(screen.getByRole("button", { name: "Bookmark" })).toHaveAttribute("aria-pressed", "false");
    expect(mocks.getBookmarks).toHaveBeenCalledTimes(1);
  });

  it("bookmarks a section with internal IDs and confirms with a toast", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    mocks.auth.user = { id: "user-1" };
    let finish: (value: unknown) => void = () => {};
    mocks.createBookmark.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<Page onBookmarkChange={changed} />);

    const [first] = await screen.findAllByRole("button", { name: "Bookmark" });
    await waitFor(() => expect(first).toBeEnabled());
    await user.click(first);
    expect(mocks.createBookmark).toHaveBeenCalledWith(14, 3998, 1267, "CMPT 225 D100");
    expect(first).toBeDisabled();

    finish({ bookmarkId: 1, ...d100, createdAt: "" });
    expect(await screen.findByRole("button", { name: "Bookmarked" })).toHaveAttribute("aria-pressed", "true");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Bookmarked CMPT 225 D100. It will be in tomorrow's email.");
    expect(changed).toHaveBeenCalledOnce();
  });

  it("removes an existing bookmark", async () => {
    const user = userEvent.setup();
    mocks.auth.user = { id: "user-1" };
    mocks.getBookmarks.mockResolvedValue([{ bookmarkId: 4, createdAt: "", ...d100 }]);
    render(<Page />);

    await user.click(await screen.findByRole("button", { name: "Bookmarked" }));
    expect(mocks.deleteBookmark).toHaveBeenCalledWith(4);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Bookmark" })).toHaveLength(2));
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Removed CMPT 225 D100 from your bookmarks.");
  });

  it("keeps the action available and shows an error toast when it fails", async () => {
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert");
    mocks.auth.user = { id: "user-1" };
    mocks.createBookmark.mockRejectedValue(new Error("network unavailable"));
    render(<Page />);

    const [first] = await screen.findAllByRole("button", { name: "Bookmark" });
    await waitFor(() => expect(first).toBeEnabled());
    await user.click(first);
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Couldn't bookmark CMPT 225 D100: network unavailable"));
    expect(screen.getAllByRole("button", { name: "Bookmark" })[0]).toBeEnabled();
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
