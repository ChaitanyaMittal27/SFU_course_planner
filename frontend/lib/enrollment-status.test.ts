import { describe, expect, it } from "vitest";
import {
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_TONES,
  getEnrollmentStatus,
  seatLoadPercent,
  displayLoadPercent,
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
    expect(ENROLLMENT_STATUS_LABELS).toEqual({ open: "Open", "almost-full": "Almost full", full: "Full" });
    expect(ENROLLMENT_STATUS_TONES).toEqual({ open: "success", "almost-full": "warning", full: "destructive" });
  });
});

describe("raw seat load", () => {
  it.each([
    [199, "almost-full", 99],
    [200, "full", 100],
    [179, "open", 89],
  ] as const)("classifies and displays %s/200", (enrolled, status, percent) => {
    const raw = seatLoadPercent({ enrolled: String(enrolled), capacity: "200" });
    expect(getEnrollmentStatus(raw)).toBe(status);
    expect(displayLoadPercent(raw)).toBe(percent);
  });

  it("includes waitlists and handles unavailable or zero capacity", () => {
    expect(seatLoadPercent({ enrolled: "199 (+2)", capacity: "200" })).toBe(100.5);
    expect(seatLoadPercent({ enrolled: "199", capacity: "0" })).toBe(0);
    expect(seatLoadPercent({ enrolled: "N/A", capacity: "200" })).toBe(0);
  });
});
