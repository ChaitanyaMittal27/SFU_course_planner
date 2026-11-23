import { Progress } from "@/components/ui/progress";
import { numericStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";
import { ENROLLMENT_STATUS_TONES, getEnrollmentStatus, type EnrollmentTone } from "@/lib/enrollment-status";

interface LoadBarProps {
  percent: number;
  /** Colour the percentage by status (success / warning / destructive text). */
  tonedLabel?: boolean;
  /** Extra classes for the percentage, e.g. a "best value" highlight. */
  labelClassName?: string;
  className?: string;
}

const labelClasses: Record<EnrollmentTone, string> = {
  success: "text-success-text",
  warning: "text-warning-text",
  destructive: "text-destructive-text",
};

const fillClasses: Record<EnrollmentTone, string> = {
  success: "[&_[data-slot=progress-indicator]]:bg-success",
  warning: "[&_[data-slot=progress-indicator]]:bg-warning",
  destructive: "[&_[data-slot=progress-indicator]]:bg-destructive",
};

/** Seat load as a bar plus percentage. Colour comes from lib/enrollment-status thresholds. */
export default function LoadBar({ percent, tonedLabel = false, labelClassName, className }: LoadBarProps) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const tone = ENROLLMENT_STATUS_TONES[getEnrollmentStatus(percent)];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress
        value={clamped}
        aria-label={`${percent}% of seats filled`}
        className={cn(
          "w-14 sm:w-20 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-surface-raised",
          fillClasses[tone]
        )}
      />
      <span className={cn(numericStyles.sm, "w-10 text-right", tonedLabel ? labelClasses[tone] : "text-text-primary", labelClassName)}>
        {percent}%
      </span>
    </div>
  );
}
