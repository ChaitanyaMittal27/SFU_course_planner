import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockUser = { email: string; app_metadata?: { role?: string } };

const mocks = vi.hoisted(() => ({
  pathname: "/",
  auth: { user: null as MockUser | null, isLoading: false, signOut: vi.fn() },
}));

vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));

import Navigation from "@/components/layout/Navigation";

beforeEach(() => {
  mocks.pathname = "/";
  mocks.auth = { user: null, isLoading: false, signOut: vi.fn() };
  localStorage.clear();
});

describe("navigation", () => {
  it("marks the section active by path prefix", () => {
    mocks.pathname = "/browse/CMPT/225";
    render(<Navigation />);
    expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Graphs" })).not.toHaveAttribute("aria-current");
  });

  it("links Graphs and Compare to their default tabs and keeps them active on every tab", () => {
    mocks.pathname = "/compare/sections/cmpt/225/1267";
    const view = render(<Navigation />);
    expect(screen.getByRole("link", { name: "Compare" })).toHaveAttribute("href", "/compare/courses");
    expect(screen.getByRole("link", { name: "Compare" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Graphs" })).toHaveAttribute("href", "/graph/load");
    view.unmount();

    mocks.pathname = "/graph/grades/cmpt/225";
    render(<Navigation />);
    expect(screen.getByRole("link", { name: "Graphs" })).toHaveAttribute("aria-current", "page");
  });

  it("does not treat a shared name prefix as the same section", () => {
    mocks.pathname = "/browsers";
    render(<Navigation />);
    expect(screen.getByRole("link", { name: "Browse" })).not.toHaveAttribute("aria-current");
  });

  it("shows sign in and sign up when signed out", () => {
    render(<Navigation />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/login?tab=signup");
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument();
  });

  it("shows an account menu with dashboard and sign out when signed in", async () => {
    const user = userEvent.setup();
    mocks.auth.user = { email: "student@sfu.ca" };
    render(<Navigation />);

    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    expect(await screen.findByRole("menuitem", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("menuitem", { name: "Admin" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(mocks.auth.signOut).toHaveBeenCalledOnce();
  });

  it("adds the admin item only for admins", async () => {
    const user = userEvent.setup();
    mocks.auth.user = { email: "admin@sfu.ca", app_metadata: { role: "admin" } };
    render(<Navigation />);

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    expect(await screen.findByRole("menuitem", { name: "Admin" })).toHaveAttribute("href", "/admin");
  });

  it("opens the mobile sheet and closes it with Escape", async () => {
    const user = userEvent.setup();
    mocks.pathname = "/compare/courses";
    render(<Navigation />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const sheet = await screen.findByRole("dialog", { name: "Menu" });
    expect(sheet).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Compare" }).some((link) => link.getAttribute("aria-current") === "page")).toBe(true);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument());
  });

  it("renders a labelled theme toggle once mounted", () => {
    render(<Navigation />);
    expect(screen.getByRole("button", { name: /Switch to (light|dark) theme/ })).toBeInTheDocument();
  });
});
