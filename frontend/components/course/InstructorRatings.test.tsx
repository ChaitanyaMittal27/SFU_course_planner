import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseOffering, RmpLookup } from "@/lib/types";

const mocks = vi.hoisted(() => ({ getRmp: vi.fn(), reportRmpMismatch: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { getRmp: mocks.getRmp, reportRmpMismatch: mocks.reportRmpMismatch } }));

import InstructorRatings from "@/components/course/InstructorRatings";
import { clearRmpLookupCache } from "@/hooks/useRmpLookups";

function section(label: string, instructors: string): CourseOffering {
  return {
    section: label, infoUrl: "", term: "fall", year: 2026, semesterCode: 1267, isEnrolling: true,
    location: "Burnaby", instructors, enrolled: "10", capacity: "20", loadPercent: 50,
  };
}

const matched: RmpLookup = {
  status: "MATCHED",
  lookupId: 1,
  searchName: "Margaret Hall",
  searchUrl: "https://www.ratemyprofessors.com/search/professors/1482?q=Margaret%20Hall",
  teacher: {
    firstName: "Margaret", lastName: "Hall", department: "Criminology",
    avgRating: 4.3, avgDifficulty: 2.4, numRatings: 27, wouldTakeAgainPercent: 71.4286,
    profileUrl: "https://www.ratemyprofessors.com/professor/1436226", matchScore: 1,
  },
};

const noMatch: RmpLookup = {
  status: "NO_MATCH", lookupId: 2, searchName: "Karen Yip",
  searchUrl: "https://www.ratemyprofessors.com/search/professors/1482?q=Karen%20Yip", teacher: null,
};

const unavailable: RmpLookup = { ...noMatch, status: "UNAVAILABLE", lookupId: null };

function card(name: string) {
  return screen.getByText(name).closest("div.border") as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  clearRmpLookupCache();
  vi.spyOn(window, "open").mockImplementation(() => null);
});

describe("InstructorRatings", () => {
  it("shows skeletons first, then the matched professor's ratings and profile link", async () => {
    let finish: (value: RmpLookup) => void = () => {};
    mocks.getRmp.mockReturnValue(new Promise<RmpLookup>((resolve) => (finish = resolve)));
    render(<InstructorRatings sections={[section("CRIM 101 D100", "Hall, Margaret")]} deptCode="als" />);

    expect(screen.getByText("Margaret Hall")).toBeInTheDocument();
    expect(card("Margaret Hall")).toHaveAttribute("aria-busy", "true");
    await waitFor(() => expect(mocks.getRmp).toHaveBeenCalledWith("Hall, Margaret", "als"));

    finish(matched);
    expect(await screen.findByText("4.3 / 5")).toBeInTheDocument();
    expect(screen.getByText("2.4 / 5")).toBeInTheDocument();
    expect(screen.getByText("71%")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on Rate My Professors/ })).toHaveAttribute(
      "href",
      "https://www.ratemyprofessors.com/professor/1436226",
    );
    expect(screen.getByRole("link", { name: "Rate My Professors" })).toHaveAttribute("href", "https://www.ratemyprofessors.com");
  });

  it("shows a dash for missing values", async () => {
    mocks.getRmp.mockResolvedValue({ ...matched, teacher: { ...matched.teacher!, wouldTakeAgainPercent: null } });
    render(<InstructorRatings sections={[section("CRIM 101 D100", "Hall, Margaret")]} deptCode="als" />);
    expect(await screen.findByText("—")).toBeInTheDocument();
  });

  it("groups sections per instructor, splits co-taught sections, and skips placeholders", async () => {
    mocks.getRmp.mockResolvedValue(noMatch);
    render(
      <InstructorRatings
        sections={[
          section("CMPT 120 D100", "Fraser, Brian"),
          section("CMPT 120 D200", "Fraser, Brian; Doe, John"),
          section("CMPT 120 D300", "TBA"),
        ]}
        deptCode="cmpt"
      />,
    );

    expect(within(card("Brian Fraser")).getByText("D100")).toBeInTheDocument();
    expect(within(card("Brian Fraser")).getByText("D200")).toBeInTheDocument();
    expect(within(card("John Doe")).getByText("D200")).toBeInTheDocument();
    await waitFor(() => expect(mocks.getRmp).toHaveBeenCalledTimes(2));
    expect(mocks.getRmp).not.toHaveBeenCalledWith("TBA", "cmpt");
    await waitFor(() => expect(screen.getAllByText("Not found on Rate My Professors.")).toHaveLength(2));
  });

  it("explains when no instructor is announced", () => {
    render(<InstructorRatings sections={[section("CMPT 120 D100", "TBA")]} deptCode="cmpt" />);
    expect(screen.getByText("Instructors not announced yet.")).toBeInTheDocument();
    expect(mocks.getRmp).not.toHaveBeenCalled();
  });

  it("offers the RMP search for a no-match", async () => {
    mocks.getRmp.mockResolvedValue(noMatch);
    render(<InstructorRatings sections={[section("CRIM 101 D100", "Yip, Karen")]} deptCode="als" />);

    expect(await screen.findByText("Not found on Rate My Professors.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Search on Rate My Professors/ })).toHaveAttribute("href", noMatch.searchUrl);
    expect(screen.getByRole("button", { name: /Report wrong match/ })).toBeInTheDocument();
  });

  it("lets the user retry when RMP is unavailable, without a report button", async () => {
    const user = userEvent.setup();
    mocks.getRmp.mockResolvedValueOnce(unavailable).mockResolvedValueOnce(matched);
    render(<InstructorRatings sections={[section("CRIM 101 D100", "Hall, Margaret")]} deptCode="als" />);

    expect(await screen.findByText("Couldn't reach Rate My Professors.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Report/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("4.3 / 5")).toBeInTheDocument();
  });

  it("shows retry when the request itself fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getRmp.mockRejectedValue(new Error("network"));
    render(<InstructorRatings sections={[section("CRIM 101 D100", "Hall, Margaret")]} deptCode="als" />);
    expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("reports a match: opens the RMP search, records it, and becomes Reported", async () => {
    const user = userEvent.setup();
    mocks.getRmp.mockResolvedValue(matched);
    mocks.reportRmpMismatch.mockResolvedValue({ reportId: 9 });
    render(<InstructorRatings sections={[section("CRIM 101 D100", "Hall, Margaret")]} deptCode="als" />);

    await user.click(await screen.findByRole("button", { name: /Report wrong match/ }));

    expect(window.open).toHaveBeenCalledWith(matched.searchUrl, "_blank", "noopener,noreferrer");
    expect(mocks.reportRmpMismatch).toHaveBeenCalledWith(1);
    const reported = await screen.findByRole("button", { name: /Reported/ });
    expect(reported).toBeDisabled();
  });

  it("lets the user try again when the report fails", async () => {
    const user = userEvent.setup();
    mocks.getRmp.mockResolvedValue(matched);
    mocks.reportRmpMismatch.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce({ reportId: 9 });
    render(<InstructorRatings sections={[section("CRIM 101 D100", "Hall, Margaret")]} deptCode="als" />);

    await user.click(await screen.findByRole("button", { name: /Report wrong match/ }));
    const again = await screen.findByRole("button", { name: /Couldn't report, try again/ });
    expect(again).toBeEnabled();
    await user.click(again);
    expect(await screen.findByRole("button", { name: /Reported/ })).toBeDisabled();
  });
});
