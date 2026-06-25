import { Skeleton } from "@/components/ui/skeleton";

interface AdminPageSkeletonProps {
  statCards?: number;
  hasChart?: boolean;
  hasTable?: boolean;
  tableRows?: number;
  hasSecondTable?: boolean;
}

export default function AdminPageSkeleton({
  statCards,
  hasChart,
  hasTable,
  tableRows = 8,
  hasSecondTable,
}: AdminPageSkeletonProps) {
  const gridCols =
    statCards === 5 ? "grid-cols-2 lg:grid-cols-5"
    : statCards === 4 ? "grid-cols-2 lg:grid-cols-4"
    : "grid-cols-2";

  return (
    <div className="flex-1 p-8 max-w-[1180px]">
      {/* Heading */}
      <div className="mb-6">
        <Skeleton className="h-8 w-52 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Stat cards */}
      {statCards && (
        <div className={`grid ${gridCols} gap-3.5 mb-8`}>
          {Array.from({ length: statCards }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Chart */}
      {hasChart && <Skeleton className="h-64 rounded-xl mb-8" />}

      {/* Table */}
      {hasTable && (
        <Skeleton className={`h-[${tableRows * 48}px] min-h-64 rounded-xl ${hasSecondTable ? "mb-8" : ""}`} style={{ height: tableRows * 48 }} />
      )}

      {/* Second table */}
      {hasSecondTable && (
        <Skeleton className="rounded-xl" style={{ height: tableRows * 40 }} />
      )}
    </div>
  );
}
