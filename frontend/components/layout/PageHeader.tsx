import type { ReactNode } from "react";
import { bodyStyles, displayStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons or controls shown beside the title on wider screens. */
  actions?: ReactNode;
  className?: string;
}

/** The page's single <h1>, with optional description and actions. Use on every page. */
export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className={cn(displayStyles.mdResponsive, "text-text-primary")}>{title}</h1>
        {description && <p className={cn(bodyStyles.lg, "mt-2 max-w-2xl text-text-muted")}>{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
