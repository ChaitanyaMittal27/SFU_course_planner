"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, AdminBookmarksResponse } from "@/lib/api";
import { courseHref } from "@/lib/course-routes";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import { AdminPage, AdminPageHeader, AdminStats, AdminTable } from "@/components/admin/AdminPage";
import SectionCard from "@/components/course/SectionCard";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { Button } from "@/components/ui/button";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatMonth(month: string) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-CA", { month: "short", year: "2-digit" });
}

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
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12 }} labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }} />
                  <Line type="monotone" dataKey="bookmarks" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--accent)" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`${bodyStyles.md} py-12 text-center text-text-muted`}>Not enough bookmark history yet.</p>
          )}
      </SectionCard>

      <AdminTable title="Most bookmarked courses" note={`Top ${topCourses.length}`} className="mb-6">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-surface-raised">
              <tr className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 text-right font-medium">Bookmarks</th>
              </tr>
            </thead>
            <tbody>
              {topCourses.map((course, index) => (
                <tr key={`${course.deptCode}-${course.courseNumber}`} className="border-t border-border hover:bg-surface-raised">
                  <td className={`${numericStyles.sm} px-4 py-3 text-text-subtle`}>{index + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={courseHref(course.deptCode, course.courseNumber)} className={`${labelStyles.lg} text-text-primary hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
                      {course.deptCode.toUpperCase()} {course.courseNumber}
                    </Link>
                  </td>
                  <td className={`${bodyStyles.sm} max-w-56 truncate px-4 py-3 text-text-muted`}>{course.departmentName}</td>
                  <td className={`${bodyStyles.sm} max-w-80 truncate px-4 py-3 text-text-muted`}>{course.title || "—"}</td>
                  <td className={`${numericStyles.sm} px-4 py-3 text-right text-text-primary`}>{course.bookmarkCount}</td>
                </tr>
              ))}
              {topCourses.length === 0 && (
                <tr><td colSpan={5} className={`${bodyStyles.md} px-4 py-10 text-center text-text-muted`}>No bookmarks found.</td></tr>
              )}
            </tbody>
          </table>
      </AdminTable>

      <AdminTable title="Department rankings" note={`${departmentRankings.length} departments`}>
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-surface-raised">
              <tr className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 text-right font-medium">Bookmarks</th>
                <th className="px-4 py-3 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {departmentRankings.map((department, index) => (
                <tr key={department.deptCode} className="border-t border-border">
                  <td className={`${numericStyles.sm} px-4 py-3 text-text-subtle`}>{index + 1}</td>
                  <td className={`${labelStyles.lg} px-4 py-3 text-text-primary`}>{department.deptCode.toUpperCase()}</td>
                  <td className={`${bodyStyles.sm} max-w-80 truncate px-4 py-3 text-text-muted`}>{department.departmentName}</td>
                  <td className={`${numericStyles.sm} px-4 py-3 text-right text-text-primary`}>{department.bookmarkCount}</td>
                  <td className="min-w-44 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(department.bookmarkCount / maxDeptCount) * 100}%` }} />
                      </div>
                      <span className={`${numericStyles.sm} w-12 text-right text-text-subtle`}>{department.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {departmentRankings.length === 0 && (
                <tr><td colSpan={5} className={`${bodyStyles.md} px-4 py-10 text-center text-text-muted`}>No department ranking data found.</td></tr>
              )}
            </tbody>
          </table>
      </AdminTable>
    </AdminPage>
  );
}
