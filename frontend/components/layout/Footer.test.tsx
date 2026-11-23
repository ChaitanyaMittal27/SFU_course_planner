import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));

import Footer from "@/components/layout/Footer";

describe("footer", () => {
  it("shows the current year and no decorative tagline", () => {
    render(<Footer />);
    expect(screen.getByText(`© ${new Date().getFullYear()} SFU Course Planner`)).toBeInTheDocument();
    expect(screen.queryByText(/Made with/)).not.toBeInTheDocument();
  });

  it("links to the legal pages, API docs and GitHub", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/termsofservice");
    expect(screen.getByRole("link", { name: "API docs" }).getAttribute("href")).toMatch(/\/api-docs$/);
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/ChaitanyaMittal27/SFU_course_planner"
    );
  });
});
