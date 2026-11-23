import type { ReactNode } from "react";
import SectionCard from "@/components/course/SectionCard";
import SummaryRow from "@/components/course/SummaryRow";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

type AdminPageProps = {
  children: ReactNode;
  className?: string;
};

type AdminPageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export type AdminStat = {
  label: string;
  value: ReactNode;
  /** Text colour token for the value, e.g. "text-success-text". */
  tone?: string;
};

type AdminTableProps = {
  /** Card header strip. */
  title: string;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Admin content column: the shared page width beside the sidebar. */
export function AdminPage({ children, className }: AdminPageProps) {
  return <div className={cn("w-full max-w-page p-4 sm:p-6 lg:p-8", className)}>{children}</div>;
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return <PageHeader title={title} description={description} actions={actions} />;
}

/** KPI numbers as the plain summary row (no tiles). */
export function AdminStats({ items }: { items: AdminStat[] }) {
  return (
    <SummaryRow
      items={items.map((item) => ({
        label: item.label,
        value: <span className={cn(item.tone ?? "text-text-primary")}>{item.value}</span>,
      }))}
    />
  );
}

/** A table (or list) in its own card: header strip, content edge to edge. */
export function AdminTable({ title, note, children, className }: AdminTableProps) {
  return (
    <SectionCard title={title} note={note} flush className={className}>
      <div className="overflow-x-auto">{children}</div>
    </SectionCard>
  );
}

/** Shared table cell classes for admin tables inside an AdminTable card. */
export const adminTable = {
  head: "bg-surface-raised",
  th: "px-4 py-2.5 text-left font-medium text-text-muted sm:px-5",
  row: "border-t border-border transition-colors hover:bg-surface-raised",
  td: "px-4 py-3 sm:px-5",
};
