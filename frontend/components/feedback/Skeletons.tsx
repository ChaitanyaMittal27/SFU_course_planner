import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Skeleton building blocks for pages whose loaded layout is known.
// Each block announces a single "Loading" status and hides its shapes.

interface LoadingRegionProps {
  label?: string;
  className?: string;
  children: React.ReactNode;
}

function LoadingRegion({ label = "Loading", className, children }: LoadingRegionProps) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

const widths = ["w-full", "w-11/12", "w-4/5", "w-2/3", "w-3/4"];

interface TableRowsSkeletonProps {
  rows?: number;
  columns?: number;
  label?: string;
  className?: string;
}

/** Placeholder for a data table: a header row plus body rows separated by dividers. */
export function TableRowsSkeleton({ rows = 5, columns = 4, label, className }: TableRowsSkeletonProps) {
  const cols = Array.from({ length: columns });
  return (
    <LoadingRegion label={label} className={className}>
      <div className="flex gap-4 border-b border-border pb-3">
        {cols.map((_, c) => (
          <Skeleton key={c} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-border py-3.5">
          {cols.map((_, c) => (
            <Skeleton key={c} className={cn("h-4 flex-1", c === 0 ? "max-w-32" : "")} />
          ))}
        </div>
      ))}
    </LoadingRegion>
  );
}

interface TextBlockSkeletonProps {
  lines?: number;
  /** Render a heading-sized bar above the lines. */
  heading?: boolean;
  label?: string;
  className?: string;
}

/** Placeholder for a heading and paragraph. */
export function TextBlockSkeleton({ lines = 3, heading = false, label, className }: TextBlockSkeletonProps) {
  return (
    <LoadingRegion label={label} className={className}>
      {heading && <Skeleton className="mb-4 h-6 w-1/3" />}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === lines - 1 && lines > 1 ? "w-3/5" : widths[i % widths.length])} />
        ))}
      </div>
    </LoadingRegion>
  );
}

interface ChartAreaSkeletonProps {
  label?: string;
  className?: string;
}

/** Placeholder for a chart; matches the default h-96 chart height. Override with className. */
export function ChartAreaSkeleton({ label, className }: ChartAreaSkeletonProps) {
  return (
    <LoadingRegion label={label} className={className}>
      <Skeleton className="h-96 w-full" />
    </LoadingRegion>
  );
}
