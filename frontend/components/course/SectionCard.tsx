import { useId, type ReactNode } from "react";
import { bodyStyles, headerStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

/**
 * One card = one section of content (see agent-docs/coding-standards.md).
 * Never put a bordered element inside; tables run edge to edge.
 */
export const cardClass = "overflow-hidden rounded-lg border border-border bg-surface";

/** Padding shared by card header strips, bodies and footers. */
export const cardPadding = "px-4 py-4 sm:px-5";

/** Table classes for edge-to-edge tables inside a card. */
export const cardTable = {
  headRow: "bg-surface-raised hover:bg-surface-raised",
  head: cn(bodyStyles.sm, "h-auto px-3 py-2.5 font-medium text-text-muted first:pl-4 last:pr-4 sm:px-5 sm:first:pl-5 sm:last:pr-5"),
  row: "border-b-0 border-t border-border first:border-t-0 hover:bg-surface-raised",
  cell: "px-3 py-3 first:pl-4 last:pr-4 sm:px-5 sm:first:pl-5 sm:last:pr-5",
};

interface SectionCardProps {
  title: ReactNode;
  /** Secondary line under the title, e.g. a course title. */
  description?: ReactNode;
  /** Small text-subtle note on the right of the header strip. */
  note?: ReactNode;
  /** Card footer, above a top border (e.g. a "Show more" button). */
  footer?: ReactNode;
  /** Remove body padding, e.g. for an edge-to-edge table. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export default function SectionCard({ title, description, note, footer, flush = false, className, children }: SectionCardProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={cn(cardClass, className)}>
      <header className={cn(cardPadding, "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border")}>
        <div className="min-w-0">
          <h2 id={headingId} className={cn(headerStyles.md, "text-text-primary")}>
            {title}
          </h2>
          {description && <p className={cn(bodyStyles.sm, "mt-0.5 text-text-muted")}>{description}</p>}
        </div>
        {note && <div className={cn(bodyStyles.sm, "text-text-subtle")}>{note}</div>}
      </header>
      <div className={flush ? undefined : cardPadding}>{children}</div>
      {footer && <footer className={cn(cardPadding, "border-t border-border")}>{footer}</footer>}
    </section>
  );
}
