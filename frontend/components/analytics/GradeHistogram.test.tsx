import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GradeHistogram, { buildGradeBars } from "@/components/analytics/GradeHistogram";

const distribution = { "A+": 5, A: 15, "B-": 40, C: 30, F: 10 };

describe("GradeHistogram", () => {
  it("orders grades and converts counts to percentages", () => {
    expect(buildGradeBars(distribution).map((bar) => [bar.grade, Math.round(bar.percent)])).toEqual([
      ["A+", 5], ["A", 15], ["B-", 40], ["C", 30], ["F", 10],
    ]);
  });

  it("highlights the median bar and summarises median and fail rate", () => {
    const { container } = render(<GradeHistogram distribution={distribution} medianGrade="B-" failRate={8} />);
    expect(screen.getByText("Median B- · Fail rate 8%")).toBeInTheDocument();

    const median = container.querySelector("[data-median]") as HTMLElement;
    expect(median).toHaveTextContent("40%");
    expect(median).toHaveTextContent("B-");
    expect(median.querySelector(".bg-accent")).not.toBeNull();
    expect(container.querySelectorAll(".bg-accent")).toHaveLength(1);
    expect(screen.getByText("B-")).toHaveClass("font-bold");
    expect(screen.getByText("A")).not.toHaveClass("font-bold");
  });

  it("describes every value in the image label", () => {
    render(<GradeHistogram distribution={distribution} medianGrade="B-" failRate={8} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Grade distribution. Median B- · Fail rate 8%. A+ 5%, A 15%, B- 40%, C 30%, F 10%",
    );
  });

  it("still renders bars without a median or fail rate", () => {
    const { container } = render(<GradeHistogram distribution={distribution} />);
    expect(container.querySelector(".bg-accent")).toBeNull();
    expect(screen.getByRole("img")).toHaveAccessibleName("Grade distribution. A+ 5%, A 15%, B- 40%, C 30%, F 10%");
  });
});
