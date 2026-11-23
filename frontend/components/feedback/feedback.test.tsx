import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookOpen } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import { TableRowsSkeleton } from "@/components/feedback/Skeletons";

describe("shared feedback", () => {
  it("renders and invokes an optional retry action", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<ErrorMessage message="Unable to load courses." onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load courses.");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("uses a neutral default title and accepts a custom one", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const { rerender } = render(<ErrorMessage message="Unable to load courses." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();

    rerender(<ErrorMessage title="Couldn't load offerings" message="CourseSys did not respond." onRetry={retry} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load offerings");
    expect(alert).not.toHaveTextContent("Something went wrong");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("announces loading once, whatever the spinner size", () => {
    render(<LoadingSpinner size="sm" label="Loading offerings" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading offerings");
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("renders skeleton blocks as a single loading status", () => {
    render(<TableRowsSkeleton rows={3} columns={2} label="Loading sections" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading sections");
  });

  it("renders an explanatory empty state", () => {
    render(<TaskEmptyState icon={BookOpen} title="No courses selected" description="Choose a course to continue." />);
    expect(screen.getByRole("heading", { name: "No courses selected" })).toBeInTheDocument();
    expect(screen.getByText("Choose a course to continue.")).toBeInTheDocument();
  });
});
