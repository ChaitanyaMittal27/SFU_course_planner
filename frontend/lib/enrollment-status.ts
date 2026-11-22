// Single source of truth for seat-load status. These thresholds match the
// backend email digest (NotificationScheduler): Full at >= 100%, Almost full at >= 90%.

export const ALMOST_FULL_THRESHOLD = 90;
export const FULL_THRESHOLD = 100;

export type EnrollmentStatus = "open" | "almost-full" | "full";

/** Visual tone shared by badges and load bars. */
export type EnrollmentTone = "success" | "warning" | "destructive";

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  open: "Open",
  "almost-full": "Almost full",
  full: "Full",
};

export const ENROLLMENT_STATUS_TONES: Record<EnrollmentStatus, EnrollmentTone> = {
  open: "success",
  "almost-full": "warning",
  full: "destructive",
};

export function getEnrollmentStatus(loadPercent: number): EnrollmentStatus {
  if (!Number.isFinite(loadPercent)) return "open";
  if (loadPercent >= FULL_THRESHOLD) return "full";
  if (loadPercent >= ALMOST_FULL_THRESHOLD) return "almost-full";
  return "open";
}

export function getEnrollmentStatusLabel(loadPercent: number): string {
  return ENROLLMENT_STATUS_LABELS[getEnrollmentStatus(loadPercent)];
}
