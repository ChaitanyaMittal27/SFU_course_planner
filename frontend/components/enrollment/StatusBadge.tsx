import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_TONES,
  getEnrollmentStatus,
  type EnrollmentTone,
} from "@/lib/enrollment-status";

type StatusBadgeProps = { className?: string } & (
  | { /** Derive Open / Almost full / Full from seat load. */ loadPercent: number; status?: never }
  | { /** A non-load label such as "Enrolling" or "Cancelled". */ status: string; loadPercent?: never }
);

type Tone = EnrollmentTone | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-tint text-success-text border-success/30",
  warning: "bg-warning-tint text-warning-text border-warning/30",
  destructive: "bg-destructive-tint text-destructive-text border-destructive/30",
  neutral: "bg-surface-raised text-text-muted border-border",
};

// Tones for free-text statuses. Load-based statuses use lib/enrollment-status.
const statusTones: Record<string, Tone> = {
  open: "success",
  enrolling: "success",
  waitlist: "warning",
  "almost full": "warning",
  full: "destructive",
  closed: "destructive",
  cancelled: "neutral",
};

export default function StatusBadge({ status, loadPercent, className }: StatusBadgeProps) {
  let label: string;
  let tone: Tone;

  if (loadPercent !== undefined) {
    const derived = getEnrollmentStatus(loadPercent);
    label = ENROLLMENT_STATUS_LABELS[derived];
    tone = ENROLLMENT_STATUS_TONES[derived];
  } else {
    label = status;
    tone = statusTones[status.toLowerCase()] ?? "neutral";
  }

  return (
    <Badge variant="outline" className={cn(toneClasses[tone], className)}>
      {label}
    </Badge>
  );
}
