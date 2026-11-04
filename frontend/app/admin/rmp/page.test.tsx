import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminRmpReport } from "@/lib/types";

const apiMocks = vi.hoisted(() => ({
  getAdminRmpReports: vi.fn(),
  dismissRmpReports: vi.fn(),
  setRmpNoMatch: vi.fn(),
  setRmpProfessor: vi.fn(),
}));

// The real ApiError class is used, so the Supabase client it imports is stubbed.
vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: { getSession: vi.fn() } } }));
vi.mock("@/lib/api", async () => {
  const { ApiError } = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { api: apiMocks, ApiError };
});

import AdminRmpReportsPage from "@/app/admin/rmp/page";
import { ApiError } from "@/lib/api";

const hall: AdminRmpReport = {
  lookupId: 12,
  rawName: "Hall, Margaret",
  displayName: "Margaret Hall",
  deptCode: "als",
  status: "MATCHED",
  rmpLegacyId: 1436226,
  profileUrl: "https://www.ratemyprofessors.com/professor/1436226",
  matchScore: 0.82,
  openReports: 3,
  firstReportedAt: "2026-11-01T10:00:00Z",
  lastReportedAt: "2026-11-03T09:30:00Z",
};

const gomez: AdminRmpReport = {
  lookupId: 7,
  rawName: "Gomez Borquez, Claudia",
  displayName: "Claudia Gomez Borquez",
  deptCode: "bus",
  status: "NO_MATCH",
  rmpLegacyId: null,
  profileUrl: null,
  matchScore: null,
  openReports: 1,
  firstReportedAt: "2026-11-02T08:00:00Z",
  lastReportedAt: "2026-11-02T08:00:00Z",
};

async function openRow(name: string) {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: new RegExp(name) }));
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  apiMocks.getAdminRmpReports.mockResolvedValue([hall, gomez]);
  apiMocks.dismissRmpReports.mockResolvedValue(undefined);
  apiMocks.setRmpNoMatch.mockResolvedValue(undefined);
  apiMocks.setRmpProfessor.mockResolvedValue(undefined);
});

describe("Admin RMP Reports page", () => {
  it("lists reported instructors with their current match and counts", async () => {
    render(<AdminRmpReportsPage />);

    expect(await screen.findByRole("heading", { name: "RMP Reports" })).toBeInTheDocument();
    expect(screen.getByText("Margaret Hall")).toBeInTheDocument();
    expect(screen.getByText("Hall, Margaret · ALS")).toBeInTheDocument();
    expect(screen.getByText("RMP #1436226")).toBeInTheDocument();
    expect(screen.getByText("Score 0.82")).toBeInTheDocument();
    expect(screen.getByText("3 reports")).toBeInTheDocument();
    expect(screen.getByText("No match")).toBeInTheDocument();
    expect(screen.getByText("1 report")).toBeInTheDocument();
    // Stats: 2 instructors, 4 open reports.
    expect(screen.getByText("Instructors to review").nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText("Open reports").nextElementSibling).toHaveTextContent("4");
  });

  it("shows an empty state", async () => {
    apiMocks.getAdminRmpReports.mockResolvedValue([]);
    render(<AdminRmpReportsPage />);
    expect(await screen.findByText("No open reports")).toBeInTheDocument();
  });

  it("shows a retryable error when the list fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiMocks.getAdminRmpReports.mockRejectedValueOnce(new Error("API Error: 500 Server Error"));
    render(<AdminRmpReportsPage />);
    expect(await screen.findByText("API Error: 500 Server Error")).toBeInTheDocument();
  });

  it("expands a matched row with the profile link and the actions", async () => {
    render(<AdminRmpReportsPage />);
    await openRow("Margaret Hall");

    expect(screen.getByRole("button", { name: /Margaret Hall/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Open link/ })).toHaveAttribute("href", hall.profileUrl);
    expect(screen.getByRole("button", { name: "No match" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Match is correct/ })).toBeEnabled();
    expect(screen.getByLabelText("Correct professor's RMP link")).toBeInTheDocument();
  });

  it("has no link to open for a no-match", async () => {
    render(<AdminRmpReportsPage />);
    await openRow("Claudia Gomez Borquez");

    expect(screen.queryByRole("link", { name: /Open link/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /No link/ })).toBeDisabled();
  });

  it("Match is correct resolves the reports and removes the row", async () => {
    render(<AdminRmpReportsPage />);
    const user = await openRow("Margaret Hall");

    await user.click(screen.getByRole("button", { name: /Match is correct/ }));

    expect(apiMocks.dismissRmpReports).toHaveBeenCalledWith(12);
    await waitFor(() => expect(screen.queryByText("Margaret Hall")).not.toBeInTheDocument());
    expect(screen.getByText("Claudia Gomez Borquez")).toBeInTheDocument();
  });

  it("No match clears the professor and removes the row", async () => {
    render(<AdminRmpReportsPage />);
    const user = await openRow("Margaret Hall");

    await user.click(screen.getByRole("button", { name: "No match" }));

    expect(apiMocks.setRmpNoMatch).toHaveBeenCalledWith(12);
    await waitFor(() => expect(screen.queryByText("Margaret Hall")).not.toBeInTheDocument());
  });

  it("keeps the row and shows an error when an action fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiMocks.setRmpNoMatch.mockRejectedValueOnce(new ApiError(500, "API Error: 500 Server Error"));
    render(<AdminRmpReportsPage />);
    const user = await openRow("Margaret Hall");

    await user.click(screen.getByRole("button", { name: "No match" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't update this report. Try again.");
    expect(screen.getByText("Margaret Hall")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No match" })).toBeEnabled();
  });

  it("sets a professor from a pasted profile link", async () => {
    render(<AdminRmpReportsPage />);
    const user = await openRow("Claudia Gomez Borquez");

    await user.type(screen.getByLabelText("Correct professor's RMP link"), "https://www.ratemyprofessors.com/professor/3030010");
    await user.click(screen.getByRole("button", { name: /Set professor/ }));

    expect(apiMocks.setRmpProfessor).toHaveBeenCalledWith(7, 3030010);
    await waitFor(() => expect(screen.queryByText("Claudia Gomez Borquez")).not.toBeInTheDocument());
  });

  it("rejects a link that is not a professor profile without calling the backend", async () => {
    render(<AdminRmpReportsPage />);
    const user = await openRow("Claudia Gomez Borquez");

    await user.type(screen.getByLabelText("Correct professor's RMP link"), "https://www.ratemyprofessors.com/search/professors/1482?q=Claudia");
    await user.click(screen.getByRole("button", { name: /Set professor/ }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a Rate My Professors professor link");
    expect(screen.getByLabelText("Correct professor's RMP link")).toHaveAttribute("aria-invalid", "true");
    expect(apiMocks.setRmpProfessor).not.toHaveBeenCalled();
  });

  it.each([
    [404, "No professor with that ID on Rate My Professors."],
    [400, "That professor isn't at an SFU listing on Rate My Professors."],
    [503, "Couldn't reach Rate My Professors. Try again."],
    [500, "Couldn't set the professor. Try again."],
  ])("explains a %i from the backend when setting a professor", async (status, message) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiMocks.setRmpProfessor.mockRejectedValueOnce(new ApiError(status, `API Error: ${status}`));
    render(<AdminRmpReportsPage />);
    const user = await openRow("Claudia Gomez Borquez");

    await user.type(screen.getByLabelText("Correct professor's RMP link"), "ratemyprofessors.com/professor/3030010");
    await user.click(screen.getByRole("button", { name: /Set professor/ }));

    const row = screen.getByRole("button", { name: /Claudia Gomez Borquez/ }).closest("li") as HTMLElement;
    expect(await within(row).findByRole("alert")).toHaveTextContent(message);
    expect(within(row).getByRole("button", { name: /Set professor/ })).toBeEnabled();
  });
});
