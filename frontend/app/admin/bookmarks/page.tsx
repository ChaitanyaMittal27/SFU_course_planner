"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { api, AdminBookmarksResponse } from "@/lib/api";
import { courseHref } from "@/lib/course-routes";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AdminPage, AdminPageHeader, AdminStats, AdminTable } from "@/components/admin/AdminPage";
import SectionCard, { cardTable } from "@/components/course/SectionCard";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { Button } from "@/components/ui/button";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatMonth(month: string) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-CA", { month: "short", year: "2-digit" });
}

// Same chart wrapper, tokens and tooltip as the Graphs pages.
const chartConfig = { bookmarks: { label: "Bookmarks", color: "var(--chart-2)" } } satisfies ChartConfig;

export default function AdminBookmarksPage() {
  const [data, setData] = useState<AdminBookmarksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBookmarks() {
      try {
        const result = await api.getAdminBookmarks();
        if (active) {
          setError(null);
          setData(result);
        }
      } catch (requestError: unknown) {
        if (active) setError(errorMessage(requestError, "Failed to load bookmark analytics."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBookmarks();
    return () => { active = false; };
  }, []);

  const fetchBookmarks = useCallback(async () => {
    try {
      setError(null);
      setData(await api.getAdminBookmarks());
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, "Failed to load bookmark analytics."));
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookmarks();
    setRefreshing(false);
  };

  const chartData = useMemo(
    () => data?.monthlyGrowth.map((month) => ({ month: formatMonth(month.month), bookmarks: month.count })) ?? [],
    [data],
  );

  if (loading) return <AdminPageSkeleton statCards={4} hasChart hasTable tableRows={10} hasSecondTable />;

  const actions = (
    <Button type="button" onClick={handleRefresh} disabled={refreshing} className="gap-2">
      <RefreshCw className={refreshing ? "animate-spin" : ""} />
      Refresh
    </Button>
  );

  if (error && !data) {
    return (
      <AdminPage>
        <AdminPageHeader title="Bookmark analytics" description="Platform-wide bookmark trends, popular courses, and department rankings." actions={actions} />
        <ErrorMessage message={error} onRetry={handleRefresh} />
      </AdminPage>
    );
  }

  if (!data) return null;

  const { stats, topCourses, departmentRankings } = data;
  const maxDeptCount = Math.max(...departmentRankings.map((department) => department.bookmarkCount), 1);
  const statItems = [
    { label: "Total bookmarks", value: stats.totalBookmarks.toLocaleString() },
    { label: "Avg bookmarks per user", value: stats.avgPerUser.toLocaleString() },
    {
      label: "Top department",
      value: (
        <>
          {stats.topDepartment.toUpperCase()}
          {stats.topDepartmentName && <span className={`${bodyStyles.sm} ml-2 font-sans font-normal text-text-muted`}>{stats.topDepartmentName}</span>}
        </>
      ),
    },
    { label: "Unique courses", value: stats.uniqueCourses.toLocaleString() },
  ];

  return (
    <AdminPage>
      <AdminPageHeader title="Bookmark analytics" description="Platform-wide bookmark trends, popular courses, and department rankings." actions={actions} />

      {error && <ErrorMessage className="mb-6" message={error} onRetry={handleRefresh} />}

      <AdminStats items={statItems} />

      <SectionCard title="Bookmarks added by month" className="mb-6">
          {chartData.length > 1 ? (
            <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} minTickGap={6} />
                <YAxis allowDecimals={false} width={40} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="bookmarks" stroke="var(--color-bookmarks)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-bookmarks)" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className={`${bodyStyles.md} py-12 text-center text-text-muted`}>Not enough bookmark history yet.</p>
          )}
      </SectionCard>

      <AdminTable title="Most bookmarked courses" note={`Top ${topCourses.length}`} className="mb-6">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className={cardTable.headRow}>
                <TableHead className={cardTable.head}>#</TableHead>
                <TableHead className={cardTable.head}>Course</TableHead>
                <TableHead className={cardTable.head}>Department</TableHead>
                <TableHead className={cardTable.head}>Title</TableHead>
                <TableHead className={cn(cardTable.head, "text-right")}>Bookmarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCourses.map((course, index) => (
                <TableRow key={`${course.deptCode}-${course.courseNumber}`} className={cardTable.row}>
                  <TableCell className={cn(cardTable.cell, numericStyles.sm, "text-text-subtle")}>{index + 1}</TableCell>
                  <TableCell className={cardTable.cell}>
                    <Link href={courseHref(course.deptCode, course.courseNumber)} className={`${labelStyles.lg} text-text-primary hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
                      {course.deptCode.toUpperCase()} {course.courseNumber}
                    </Link>
                  </TableCell>
                  <TableCell className={cn(cardTable.cell, bodyStyles.sm, "max-w-56 truncate text-text-muted")}>{course.departmentName}</TableCell>
                  <TableCell className={cn(cardTable.cell, bodyStyles.sm, "max-w-80 truncate text-text-muted")}>{course.title || "—"}</TableCell>
                  <TableCell className={cn(cardTable.cell, numericStyles.sm, "text-right text-text-primary")}>{course.bookmarkCount}</TableCell>
                </TableRow>
              ))}
              {topCourses.length === 0 && (
                <TableRow className={cardTable.row}><TableCell colSpan={5} className={cn(cardTable.cell, bodyStyles.md, "py-10 text-center text-text-muted")}>No bookmarks found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
      </AdminTable>

      <AdminTable title="Department rankings" note={`${departmentRankings.length} departments`}>
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className={cardTable.headRow}>
                <TableHead className={cardTable.head}>#</TableHead>
                <TableHead className={cardTable.head}>Code</TableHead>
                <TableHead className={cardTable.head}>Department</TableHead>
                <TableHead className={cn(cardTable.head, "text-right")}>Bookmarks</TableHead>
                <TableHead className={cardTable.head}>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentRankings.map((department, index) => (
                <TableRow key={department.deptCode} className={cardTable.row}>
                  <TableCell className={cn(cardTable.cell, numericStyles.sm, "text-text-subtle")}>{index + 1}</TableCell>
                  <TableCell className={cn(cardTable.cell, labelStyles.lg, "text-text-primary")}>{department.deptCode.toUpperCase()}</TableCell>
                  <TableCell className={cn(cardTable.cell, bodyStyles.sm, "max-w-80 truncate text-text-muted")}>{department.departmentName}</TableCell>
                  <TableCell className={cn(cardTable.cell, numericStyles.sm, "text-right text-text-primary")}>{department.bookmarkCount}</TableCell>
                  <TableCell className={cn(cardTable.cell, "min-w-44")}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(department.bookmarkCount / maxDeptCount) * 100}%` }} />
                      </div>
                      <span className={`${numericStyles.sm} w-12 text-right text-text-subtle`}>{department.percentage}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {departmentRankings.length === 0 && (
                <TableRow className={cardTable.row}><TableCell colSpan={5} className={cn(cardTable.cell, bodyStyles.md, "py-10 text-center text-text-muted")}>No department ranking data found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
      </AdminTable>
    </AdminPage>
  );
}
