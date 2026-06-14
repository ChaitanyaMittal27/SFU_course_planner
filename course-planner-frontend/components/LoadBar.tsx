import { cn } from "@/lib/utils";
import { labelStyles } from "@/app/fonts";

interface LoadBarProps {
  percent: number;
  className?: string;
}

export default function LoadBar({ percent, className }: LoadBarProps) {
  const clamped = Math.min(percent, 100);
  const fillColor =
    clamped >= 95 ? "bg-destructive" : clamped >= 80 ? "bg-warning" : "bg-success";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-20 bg-surface-raised rounded-full h-2">
        <div className={cn("h-2 rounded-full", fillColor)} style={{ width: `${clamped}%` }} />
      </div>
      <span className={cn(labelStyles.md, "text-text-primary w-10 text-right")}>
        {percent}%
      </span>
    </div>
  );
}
