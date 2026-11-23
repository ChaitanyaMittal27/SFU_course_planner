import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/components/layout/Navigation", () => ({ default: () => <nav aria-label="Main" /> }));
vi.mock("@/components/layout/Footer", () => ({ default: () => <footer>Site footer</footer> }));
import AppShell from "./AppShell";

describe("AppShell", () => {
  it.each(["/admin", "/admin/users/123", "/admin/unauthorized"])("omits public navigation and footer on %s", (pathname) => {
    mocks.pathname = pathname;
    render(<AppShell><p>Page content</p></AppShell>);
    expect(screen.queryByRole("navigation", { name: "Main" })).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Page content");
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
  });

  it.each(["/", "/browse", "/dashboard", "/administrator"])("retains public navigation and footer on %s", (pathname) => {
    mocks.pathname = pathname;
    render(<AppShell><p>Page content</p></AppShell>);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
