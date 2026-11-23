import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfessorCard from "@/components/course/ProfessorCard";
import type { RmpLookupState } from "@/hooks/useRmpLookups";
import type { RmpLookup } from "@/lib/types";

const matched: RmpLookup = {
  status: "MATCHED",
  lookupId: 7,
  searchName: "Test Instructor",
  searchUrl: "https://www.ratemyprofessors.com/search/professors/1482?q=Test",
  teacher: {
    firstName: "Test", lastName: "Instructor", department: "Computer Science",
    avgRating: 4.25, avgDifficulty: 3.1, numRatings: 112, wouldTakeAgainPercent: 84.2,
    profileUrl: "https://www.ratemyprofessors.com/professor/1", matchScore: 1,
  },
};
const noMatch: RmpLookup = { ...matched, status: "NO_MATCH", teacher: null };

function renderCard(state: RmpLookupState, overrides: Partial<React.ComponentProps<typeof ProfessorCard>> = {}) {
  const props = { name: "Test Instructor", sections: ["D100", "D200"], state, onRetry: vi.fn(), onReport: vi.fn().mockResolvedValue({ reportId: 1 }), ...overrides };
  render(<ProfessorCard {...props} />);
  return props;
}

beforeEach(() => {
  vi.spyOn(window, "open").mockImplementation(() => null);
});

describe("ProfessorCard", () => {
  it("leads with the overall rating, then difficulty, would-take-again and rating count", () => {
    renderCard({ status: "loaded", lookup: matched });
    const card = screen.getByRole("article", { name: "Test Instructor" });
    expect(within(card).getByRole("heading", { level: 3, name: "Test Instructor" })).toBeInTheDocument();
    expect(within(card).getByText("D100, D200")).toBeInTheDocument();
    expect(within(card).getByText("4.3")).toBeInTheDocument();
    expect(within(card).getByText("/ 5 overall")).toBeInTheDocument();

    const terms = within(card).getAllByRole("term").map((t) => t.textContent);
    const values = within(card).getAllByRole("definition").map((d) => d.textContent);
    expect(terms).toEqual(["Difficulty", "Would take again", "Number of ratings"]);
    expect(values).toEqual(["3.1 / 5", "84%", "112"]);
    expect(within(card).getByRole("link", { name: /View on RateMyProfessors/ })).toHaveAttribute("href", "https://www.ratemyprofessors.com/professor/1");
  });

  it("puts the rating on the left and shows a dash without a match", () => {
    const { unmount } = render(
      <ProfessorCard name="Test Instructor" sections={["D100"]} state={{ status: "loaded", lookup: matched }} onRetry={vi.fn()} onReport={vi.fn()} />,
    );
    const row = screen.getByRole("article", { name: "Test Instructor" });
    expect(row.className).not.toMatch(/\bborder\b|rounded/);
    const [rating, details] = Array.from(row.children);
    expect(rating).toHaveTextContent("4.3/ 5 overall");
    expect(details).toHaveTextContent("Test Instructor");
    expect(within(details as HTMLElement).getAllByRole("term")).toHaveLength(3);
    unmount();

    render(
      <ProfessorCard name="Test Instructor" sections={["D100"]} state={{ status: "loaded", lookup: noMatch }} onRetry={vi.fn()} onReport={vi.fn()} />,
    );
    const noMatchRow = screen.getByRole("article", { name: "Test Instructor" });
    expect(noMatchRow.children[0]).toHaveTextContent("—/ 5 overall");
    expect(within(noMatchRow).getByText("Not found on RateMyProfessors.")).toBeInTheDocument();
  });

  it("shows a skeleton while loading", () => {
    renderCard({ status: "loading" });
    expect(screen.getByRole("article", { name: "Test Instructor" })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("/ 5 overall")).not.toBeInTheDocument();
  });

  it("explains a no-match quietly and still offers the search", () => {
    renderCard({ status: "loaded", lookup: noMatch });
    expect(screen.getByText("Not found on RateMyProfessors.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Search on RateMyProfessors/ })).toHaveAttribute("href", noMatch.searchUrl);
  });

  it("offers a working retry on error, without the report action", async () => {
    const user = userEvent.setup();
    const props = renderCard({ status: "error" });
    expect(screen.getByText("Couldn't reach RateMyProfessors.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Wrong professor?" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(props.onRetry).toHaveBeenCalledOnce();
  });

  it("reports a wrong match through the existing flow", async () => {
    const user = userEvent.setup();
    const props = renderCard({ status: "loaded", lookup: matched });
    await user.click(screen.getByRole("button", { name: "Wrong professor?" }));
    expect(window.open).toHaveBeenCalledWith(matched.searchUrl, "_blank", "noopener,noreferrer");
    expect(props.onReport).toHaveBeenCalledWith(7);
    await waitFor(() => expect(screen.getByRole("button", { name: "Reported, thanks" })).toBeDisabled());
  });
});
