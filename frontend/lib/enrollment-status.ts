// Single source of truth for seat-load status. These thresholds match the
// backend email digest (NotificationScheduler): Full at >= 100%, Almost full at >= 90%.

export const ALMOST_FULL_THRESHOLD = 90;
export const FULL_THRESHOLD = 100;

export type EnrollmentStatus = "open" | "almost-full" | "full";

/** Visual tone shared by badges and load bars. */
export type EnrollmentTone = "success" | "warning" | "destructive";

/** Recompute from seats: the offering API's loadPercent is already rounded.
 * Include CourseSys waitlists, matching the backend's enrollment semantics.
 */
export function seatLoadPercent(seats: { enrolled: string | number; capacity: string | number }): number {
  const enrolled = /^(\d+)(?:\s*\(\+(\d+)\))?$/.exec(String(seats.enrolled).trim());
  const capacity = Number.parseFloat(String(seats.capacity));
  if (!enrolled || !Number.isFinite(capacity) || capacity <= 0) return 0;
  return ((Number(enrolled[1]) + Number(enrolled[2] ?? 0)) * 100) / capacity;
}

/** Whole percentage without rounding a section with available seats up to full. */
export function displayLoadPercent(percent: number): number {
  return Number.isFinite(percent) ? Math.max(0, Math.floor(percent)) : 0;
}

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
