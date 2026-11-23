import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { seatLoadPercent } from "@/lib/enrollment-status";
import LoadBar from "@/components/enrollment/LoadBar";
import StatusBadge from "@/components/enrollment/StatusBadge";

describe("enrollment status UI", () => {
  it.each([
    [199, "Almost full", "99%", "warning"],
    [200, "Full", "100%", "destructive"],
    [179, "Open", "89%", "success"],
  ] as const)("shows %s/200 with the correct status, percentage and tone", (enrolled, status, percent, tone) => {
    const raw = seatLoadPercent({ enrolled, capacity: 200 });
    render(<><LoadBar percent={raw} tonedLabel /><StatusBadge loadPercent={raw} /></>);
    expect(screen.getByText(status)).toHaveClass(`text-${tone}-text`);
    expect(screen.getByText(percent)).toHaveClass(`text-${tone}-text`);
    expect(screen.getByRole("progressbar", { name: `${percent} of seats filled` })).toBeInTheDocument();
  });
  it("derives the badge label from seat load using the shared thresholds", () => {
    const { rerender } = render(<StatusBadge loadPercent={89} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
    rerender(<StatusBadge loadPercent={95} />);
    expect(screen.getByText("Almost full")).toBeInTheDocument();
    rerender(<StatusBadge loadPercent={104} />);
    expect(screen.getByText("Full")).toBeInTheDocument();
  });

  it("renders free-text statuses as given", () => {
    render(<StatusBadge status="Enrolling" />);
    expect(screen.getByText("Enrolling")).toBeInTheDocument();
  });

  it("exposes the load as a labelled progress bar and shows the unclamped percentage", () => {
    render(<LoadBar percent={104} />);
    expect(screen.getByRole("progressbar", { name: "104% of seats filled" })).toBeInTheDocument();
    expect(screen.getByText("104%")).toBeInTheDocument();
  });
});
