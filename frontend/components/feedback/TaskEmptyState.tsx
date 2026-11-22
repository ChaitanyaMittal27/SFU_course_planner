import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { bodyStyles, headerStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

type TaskEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional next step, e.g. a button or link. */
  action?: ReactNode;
  className?: string;
};

export default function TaskEmptyState({ icon: Icon, title, description, action, className }: TaskEmptyStateProps) {
  return (
    <Empty className={cn("py-12", className)}>
      <EmptyHeader>
        <EmptyMedia>
          <Icon className="size-6 text-text-subtle" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          <h3 className={cn(headerStyles.sm, "text-text-primary")}>{title}</h3>
        </EmptyTitle>
        <EmptyDescription className={cn(bodyStyles.md, "text-text-muted")}>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
