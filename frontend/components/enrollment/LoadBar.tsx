import { Progress } from "@/components/ui/progress";
import { numericStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";
import { ENROLLMENT_STATUS_TONES, getEnrollmentStatus, type EnrollmentTone } from "@/lib/enrollment-status";

interface LoadBarProps {
  percent: number;
  className?: string;
}

const fillClasses: Record<EnrollmentTone, string> = {
  success: "[&_[data-slot=progress-indicator]]:bg-success",
  warning: "[&_[data-slot=progress-indicator]]:bg-warning",
  destructive: "[&_[data-slot=progress-indicator]]:bg-destructive",
};

/** Seat load as a bar plus percentage. Colour comes from lib/enrollment-status thresholds. */
export default function LoadBar({ percent, className }: LoadBarProps) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const tone = ENROLLMENT_STATUS_TONES[getEnrollmentStatus(percent)];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress
        value={clamped}
        aria-label={`${percent}% of seats filled`}
        className={cn(
          "w-20 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-surface-raised",
          fillClasses[tone]
        )}
      />
      <span className={cn(numericStyles.sm, "w-10 text-right text-text-primary")}>{percent}%</span>
    </div>
  );
}
