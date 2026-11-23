import type { ReactNode } from "react";
import { bodyStyles, numericStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

export interface SummaryItem {
  label: string;
  /** Items with a null value are left out. */
  value: ReactNode | null;
}

interface SummaryRowProps {
  items: SummaryItem[];
  /** Extra content at the end of the row, e.g. badges. */
  children?: ReactNode;
  className?: string;
}

const divided = "lg:border-l lg:border-border lg:pl-6 lg:first:border-l-0 lg:first:pl-0";

/** Key figures for a course or offering, on the page background, split by thin vertical dividers. */
export default function SummaryRow({ items, children, className }: SummaryRowProps) {
  const shown = items.filter((item) => item.value !== null && item.value !== undefined);
  if (shown.length === 0 && !children) return null;

  return (
    <div className={cn("mb-8 flex flex-wrap items-end gap-x-6 gap-y-4", className)}>
      {shown.length > 0 && (
        <dl className="flex min-w-0 flex-wrap gap-x-6 gap-y-4">
          {shown.map((item) => (
            <div key={item.label} className={cn(divided, "flex flex-col-reverse gap-1")}>
              <dt className={cn(bodyStyles.sm, "text-text-subtle")}>{item.label}</dt>
              <dd className={cn(numericStyles.summary, "text-text-primary")}>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children && <div className="flex flex-wrap items-center gap-2 self-center">{children}</div>}
    </div>
  );
}
