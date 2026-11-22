import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  /** Announced to screen readers. */
  label?: string;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, { wrapper: string; icon: string }> = {
  sm: { wrapper: "p-2", icon: "size-4" },
  md: { wrapper: "p-6", icon: "size-6" },
  lg: { wrapper: "p-10", icon: "size-8" },
};

/**
 * For short or unknown-shape waits. Prefer the skeletons in
 * components/feedback/Skeletons.tsx when the loaded layout is known.
 */
export default function LoadingSpinner({ size = "md", label = "Loading", className }: LoadingSpinnerProps) {
  const classes = sizeClasses[size];
  return (
    <div className={cn("flex items-center justify-center", classes.wrapper, className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Spinner role="presentation" aria-hidden="true" aria-label={undefined} className={cn(classes.icon, "text-text-subtle")} />
    </div>
  );
}
