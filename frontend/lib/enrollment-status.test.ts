import { describe, expect, it } from "vitest";
import {
  ENROLLMENT_STATUS_TONES,
  getEnrollmentStatus,
  getEnrollmentStatusLabel,
} from "@/lib/enrollment-status";

describe("getEnrollmentStatus", () => {
  it.each([
    [0, "open"],
    [89.9, "open"],
    [90, "almost-full"],
    [99.9, "almost-full"],
    [100, "full"],
    [112, "full"],
  ] as const)("classifies %s%% load as %s", (load, expected) => {
    expect(getEnrollmentStatus(load)).toBe(expected);
  });

  it("treats a non-numeric load as open rather than full", () => {
    expect(getEnrollmentStatus(Number.NaN)).toBe("open");
  });

  it("labels and tones statuses to match the email digest", () => {
    expect(getEnrollmentStatusLabel(89.9)).toBe("Open");
    expect(getEnrollmentStatusLabel(90)).toBe("Almost full");
    expect(getEnrollmentStatusLabel(100)).toBe("Full");
    expect(ENROLLMENT_STATUS_TONES).toEqual({ open: "success", "almost-full": "warning", full: "destructive" });
  });
});
