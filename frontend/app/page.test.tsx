import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEnrollingTerm: vi.fn(),
  auth: { user: null as { email: string } | null },
}));

vi.mock("@/lib/api", () => ({ api: { getEnrollingTerm: mocks.getEnrollingTerm } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));

import LandingPage from "@/app/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth = { user: null };
});

describe("landing page", () => {
  it("renders the hero copy and calls to action", async () => {
    mocks.getEnrollingTerm.mockResolvedValue(null);
    render(<LandingPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Enrollment, minus the hassle." })).toBeInTheDocument();
    expect(screen.getByText(/get one email every morning with where each one stands: open, almost full or full\./)).toBeInTheDocument();
    expect(screen.getByText("Free · sign in with Google")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start tracking courses" })).toHaveAttribute("href", "/login?tab=signup");
    expect(screen.getByRole("link", { name: "Browse courses" })).toHaveAttribute("href", "/browse");
    await waitFor(() => expect(mocks.getEnrollingTerm).toHaveBeenCalled());
  });

  it("sends signed-in users to the dashboard", () => {
    mocks.auth = { user: { email: "student@sfu.ca" } };
    mocks.getEnrollingTerm.mockResolvedValue(null);
    render(<LandingPage />);
    expect(screen.getByRole("link", { name: "Start tracking courses" })).toHaveAttribute("href", "/dashboard");
  });

  it("shows the enrolling term once it resolves", async () => {
    mocks.getEnrollingTerm.mockResolvedValue({ term: "spring", year: 2027, semesterCode: 1271 });
    render(<LandingPage />);
    expect(await screen.findByText("Spring 2027 enrollment is open")).toBeInTheDocument();
  });

  it("renders no eyebrow when there is no enrolling term", async () => {
    mocks.getEnrollingTerm.mockResolvedValue(null);
    render(<LandingPage />);
    await waitFor(() => expect(mocks.getEnrollingTerm).toHaveBeenCalled());
    expect(screen.queryByText(/enrollment is open/)).not.toBeInTheDocument();
  });

  it("includes the example email illustration", () => {
    mocks.getEnrollingTerm.mockResolvedValue(null);
    render(<LandingPage />);
    const email = screen.getByRole("figure", { name: "Example of the daily enrollment email" });
    expect(within(email).getByText("SFU Course Planner — Daily Enrollment Update")).toBeInTheDocument();
    expect(within(email).getAllByRole("row")).toHaveLength(4);
    expect(within(email).getByText("Almost Full")).toBeInTheDocument();
    expect(screen.getByText("Arrives every morning at 12:05 AM")).toBeInTheDocument();
    // No decorative "previous email" layers stacked behind the card.
    expect(email.parentElement?.querySelectorAll(':scope > [aria-hidden="true"]')).toHaveLength(0);
  });

  it("shows the stats in the hero, before the calls to action", () => {
    mocks.getEnrollingTerm.mockResolvedValue(null);
    render(<LandingPage />);
    const stats = screen.getByLabelText("SFU Course Planner in numbers");
    expect(stats.tagName).toBe("DL");
    const hero = screen.getByRole("heading", { level: 1 }).closest("section");
    expect(hero).toContainElement(stats);

    const pairs = [
      ["SFU students", "70+"],
      ["courses", "500+"],
      ["emails every morning", "50+"],
    ];
    const terms = within(stats).getAllByRole("term");
    const values = within(stats).getAllByRole("definition");
    expect(terms.map((t) => t.textContent)).toEqual(pairs.map(([label]) => label));
    expect(values.map((d) => d.textContent)).toEqual(pairs.map(([, value]) => value));

    const cta = screen.getByRole("link", { name: "Start tracking courses" });
    expect(stats.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("links each of the four features to its tool", () => {
    mocks.getEnrollingTerm.mockResolvedValue(null);
    render(<LandingPage />);
    const expected: [RegExp, string][] = [
      [/Browse live seats/, "/browse"],
      [/Compare side by side/, "/compare/courses"],
      [/See the trends/, "/graph/load"],
      [/Know your professor/, "/browse"],
    ];
    for (const [name, href] of expected) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(screen.getByRole("heading", { level: 2, name: "Everything you check during enrollment, in one place" })).toBeInTheDocument();
  });
});
