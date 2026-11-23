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
  /** 3 inside a card (under its h2); 2 when the empty state sits directly under the page h1. */
  headingLevel?: 2 | 3;
  className?: string;
};

export default function TaskEmptyState({ icon: Icon, title, description, action, headingLevel = 3, className }: TaskEmptyStateProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <Empty className={cn("py-12", className)}>
      <EmptyHeader>
        <EmptyMedia>
          <Icon className="size-6 text-text-subtle" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          <Heading className={cn(headerStyles.sm, "text-text-primary")}>{title}</Heading>
        </EmptyTitle>
        <EmptyDescription className={cn(bodyStyles.md, "text-text-muted")}>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
