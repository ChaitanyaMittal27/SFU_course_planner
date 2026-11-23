import { Skeleton } from "@/components/ui/skeleton";
import { cardClass, cardPadding } from "@/components/course/SectionCard";
import { AdminPage } from "@/components/admin/AdminPage";
import { cn } from "@/lib/utils";

interface AdminPageSkeletonProps {
  /** Number of summary-row figures. */
  statCards?: number;
  hasChart?: boolean;
  hasTable?: boolean;
  tableRows?: number;
  hasSecondTable?: boolean;
  /** Overview: a grid of section cards. */
  sectionCards?: number;
}

function TableCardSkeleton({ rows }: { rows: number }) {
  return (
    <div className={cardClass}>
      <div className={cn(cardPadding, "border-b border-border")}>
        <Skeleton className="h-5 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(cardPadding, "flex gap-4 border-t border-border py-3 first:border-t-0 sm:py-3")}>
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Loading layout matching the admin pages: header, summary row, chart card, table cards. */
export default function AdminPageSkeleton({ statCards, hasChart, hasTable, tableRows = 8, hasSecondTable, sectionCards }: AdminPageSkeletonProps) {
  return (
    <AdminPage>
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading</span>
        <div aria-hidden="true">
          <div className="mb-8">
            <Skeleton className="mb-2 h-8 w-52" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>

          {statCards && (
            <div className="mb-8 flex flex-wrap gap-x-10 gap-y-4">
              {Array.from({ length: statCards }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-6 w-14" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          )}

          {hasChart && (
            <div className={cn(cardClass, "mb-6 p-5")}>
              <Skeleton className="h-56 w-full" />
            </div>
          )}

          {sectionCards && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: sectionCards }).map((_, i) => (
                <div key={i} className={cn(cardClass, "space-y-3 p-5")}>
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          )}

          {hasTable && (
            <div className={hasSecondTable ? "mb-6" : undefined}>
              <TableCardSkeleton rows={tableRows} />
            </div>
          )}
          {hasSecondTable && <TableCardSkeleton rows={Math.max(3, Math.round(tableRows / 2))} />}
        </div>
      </div>
    </AdminPage>
  );
}
