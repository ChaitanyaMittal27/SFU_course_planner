import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("accepts the xl size used for the landing calls to action", () => {
    render(<Button size="xl">Start tracking courses</Button>);
    const button = screen.getByRole("button", { name: "Start tracking courses" });
    expect(button).toHaveClass("h-12", "px-6");
    expect(button).not.toHaveClass("h-8");
  });

  it("exposes the xl size through buttonVariants for links styled as buttons", () => {
    expect(buttonVariants({ size: "xl" })).toContain("h-12");
  });
});
