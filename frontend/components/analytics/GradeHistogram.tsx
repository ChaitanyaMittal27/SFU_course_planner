import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import { formatPercent } from "@/lib/course-stats";
import { GRADE_ORDER } from "@/lib/grades";
import { cn } from "@/lib/utils";

type Props = {
  /** Student counts per grade, e.g. { "A+": 68, "A": 218, ... }. */
  distribution: Record<string, number>;
  /** Highlighted bar and summary line; omit to show bars only. */
  medianGrade?: string | null;
  failRate?: number | null;
  /** Chart height: "sm" for side-by-side comparisons, "lg" for the Grades graph. */
  size?: "sm" | "md" | "lg";
  className?: string;
};

const heights = { sm: "h-36", md: "h-48", lg: "h-56 sm:h-72" };


export function buildGradeBars(distribution: Record<string, number>) {
  const present = GRADE_ORDER.filter((grade) => distribution[grade] !== undefined);
  const total = present.reduce((sum, grade) => sum + (distribution[grade] ?? 0), 0);
  return present.map((grade) => ({
    grade,
    count: distribution[grade] ?? 0,
    percent: total > 0 ? ((distribution[grade] ?? 0) / total) * 100 : 0,
  }));
}

/**
 * Grade distribution as plain bars: muted bars, the median grade's bar in the accent
 * colour, % above each bar and the grade below. Exposed to assistive tech as one image
 * whose label lists every value.
 */
export default function GradeHistogram({ distribution, medianGrade, failRate, size = "md", className }: Props) {
  const bars = buildGradeBars(distribution);
  const maxPercent = Math.max(...bars.map((bar) => bar.percent), 0);
  const failText = formatPercent(failRate ?? null);
  const summary = [medianGrade ? `Median ${medianGrade}` : null, failText ? `Fail rate ${failText}` : null].filter(Boolean).join(" · ");

  const label = [
    "Grade distribution",
    summary,
    bars.map((bar) => `${bar.grade} ${Math.round(bar.percent)}%`).join(", "),
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <div className={className}>
      {summary && <p className={cn(bodyStyles.md, "mb-4 text-text-muted")}>{summary}</p>}
      <div role="img" aria-label={label} className={cn("flex items-end gap-1 sm:gap-1.5", heights[size])}>
        {bars.map((bar) => {
          const isMedian = bar.grade === medianGrade;
          const height = maxPercent > 0 ? (bar.percent / maxPercent) * 100 : 0;
          return (
            <div key={bar.grade} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" data-median={isMedian || undefined}>
              <span className={cn(numericStyles.sm, "text-text-muted", isMedian && "font-semibold text-text-primary")}>
                {Math.round(bar.percent)}%
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn("w-full rounded-t-sm", isMedian ? "bg-accent" : "bg-border-strong")}
                  style={{ height: `${Math.max(height, bar.count > 0 ? 2 : 0)}%` }}
                />
              </div>
              <span className={cn(labelStyles.md, isMedian ? "font-bold text-text-primary" : "text-text-muted")}>{bar.grade}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
