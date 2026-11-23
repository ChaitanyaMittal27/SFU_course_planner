import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));

import AboutPage from "@/app/about/page";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name *"), "Ada Lovelace");
  await user.type(screen.getByLabelText("Email *"), "ada@example.com");
  await user.selectOptions(screen.getByLabelText("Reason *"), "Bug Report");
  await user.type(screen.getByLabelText("Message *"), "The search box ignores my typo.");
}

describe("about page", () => {
  it("keeps the problem, solution and feature content", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1, name: "About SFU Course Planner" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "The Problem" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "The Solution" })).toBeInTheDocument();
    const features = screen.getByRole("heading", { level: 2, name: "What you can do" }).closest("section") as HTMLElement;
    expect(within(features).getAllByRole("heading", { level: 3 })).toHaveLength(4);
    expect(within(features).getByRole("link", { name: "Compare Courses" })).toHaveAttribute("href", "/compare/courses");
  });

  it("opens one FAQ answer at a time in the accordion", async () => {
    const user = userEvent.setup();
    render(<AboutPage />);
    const first = screen.getByRole("button", { name: "Is this an official SFU website?" });
    const second = screen.getByRole("button", { name: "How do Bookmarks work?" });
    expect(first).toHaveAttribute("aria-expanded", "false");

    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/independent student project/)).toBeVisible();

    await user.click(second);
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("shows an error under a field when it loses focus invalid", async () => {
    const user = userEvent.setup();
    render(<AboutPage />);
    const name = screen.getByLabelText("Name *");
    await user.type(name, "A");
    await user.tab();

    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Name must be at least 2 characters");
    await user.type(name, "da");
    expect(name).not.toHaveAttribute("aria-invalid");
  });

  it("validates every field on submit without sending", async () => {
    const user = userEvent.setup();
    render(<AboutPage />);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(screen.getByLabelText("Name *")).toHaveAccessibleDescription("Name must be at least 2 characters");
    expect(screen.getByLabelText("Email *")).toHaveAccessibleDescription("Please enter a valid email address");
    expect(screen.getByLabelText("Reason *")).toHaveAccessibleDescription("Please select a reason");
    expect(screen.getByLabelText("Message *")).toHaveAccessibleDescription("Message must be at least 10 characters");
    expect(screen.getByLabelText("Name *")).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a valid message and confirms with a toast", async () => {
    const user = userEvent.setup();
    render(<AboutPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("Thanks for reaching out! We'll respond ASAP."));
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/contact$/);
    expect(JSON.parse(init.body)).toEqual({ name: "Ada Lovelace", email: "ada@example.com", reason: "Bug Report", message: "The search box ignores my typo." });
    expect(screen.getByLabelText("Name *")).toHaveValue("");
  });

  it("reports a failed send with an error toast and keeps the form", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue({ ok: false });
    render(<AboutPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Failed to send message. Please try again or contact us directly via GitHub."));
    expect(screen.getByLabelText("Name *")).toHaveValue("Ada Lovelace");
  });
});
