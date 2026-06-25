"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Bookmark, Users, Trophy, GraduationCap } from "lucide-react";
import { api, AdminBookmarksResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorMessage from "@/components/ErrorMessage";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function AdminBookmarksPage() {
  const [data, setData] = useState<AdminBookmarksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await api.getAdminBookmarks();
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load bookmark analytics";
      setError(message);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.monthlyGrowth.map((m) => {
      const [y, mo] = m.month.split("-");
      const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      return { month: label, bookmarks: m.count };
    });
  }, [data]);

  if (loading) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <div className="mb-6">
          <Skeleton className="h-8 w-52 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl mb-8" />
        <Skeleton className="h-96 rounded-xl mb-8" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    );
  }

  if (!data) return null;

  const { stats, topCourses, departmentRankings } = data;
  const maxDeptCount = departmentRankings.length > 0 ? departmentRankings[0].bookmarkCount : 1;

  const statCards = [
    { label: "Total Bookmarks", value: stats.totalBookmarks.toLocaleString(), icon: Bookmark, color: "text-accent" },
    { label: "Avg per User", value: String(stats.avgPerUser), icon: Users, color: "text-accent" },
    {
      label: "Top Department",
      value: stats.topDepartment.toUpperCase(),
      subtitle: stats.topDepartmentName,
      icon: Trophy,
      color: "text-warning",
    },
    { label: "Unique Courses", value: String(stats.uniqueCourses), icon: GraduationCap, color: "text-success" },
  ];

  return (
    <div className="flex-1 p-8 max-w-[1180px]">
      {/* Heading */}
      <div className="mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary mb-1`}>Bookmark Analytics</h1>
        <p className={`${bodyStyles.md} text-text-muted`}>
          Platform-wide bookmark data — most watched courses, department trends and growth.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <CardContent className="p-0">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className={`${labelStyles.md} text-text-muted`}>{stat.label}</span>
              </div>
              <span className="font-mono font-semibold text-[20px] tracking-tight text-text-primary">
                {stat.value}
              </span>
              {"subtitle" in stat && stat.subtitle && (
                <span className={`${bodyStyles.sm} text-text-muted block mt-0.5`}>{stat.subtitle}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth chart */}
      {chartData.length > 1 && (
        <Card className="p-5 mb-8">
          <CardContent className="p-0">
            <h2 className={`${headerStyles.xs} text-text-primary mb-4`}>Bookmarks over time</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bookmarks"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--accent)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Most bookmarked courses */}
      <div className="flex items-center justify-between mb-3">
        <h2 className={`${headerStyles.xs} text-text-primary`}>Most bookmarked courses</h2>
        <span className={`${labelStyles.sm} font-mono text-text-subtle`}>Top {topCourses.length}</span>
      </div>

      <Card className="overflow-hidden mb-8">
        <CardContent className="p-0">
          <div className="grid grid-cols-[40px_1fr_1fr_100px_80px] px-[18px] py-2.5 bg-surface-raised border-b border-border">
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>#</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>Course</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>Department</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Title</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Marks</span>
          </div>
          {topCourses.map((course, i) => (
            <div
              key={`${course.deptCode}-${course.courseNumber}`}
              className={`grid grid-cols-[40px_1fr_1fr_100px_80px] px-[18px] py-3 items-center hover:bg-surface-raised transition-colors ${
                i < topCourses.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className={`${labelStyles.md} font-mono text-text-subtle`}>{i + 1}</span>
              <span className={`${labelStyles.lg} text-text-primary`}>
                {course.deptCode.toUpperCase()} {course.courseNumber}
              </span>
              <span className={`${bodyStyles.sm} text-text-muted truncate`}>{course.departmentName}</span>
              <span className={`${bodyStyles.sm} text-text-muted text-center truncate`}>{course.title || "—"}</span>
              <span className={`${labelStyles.md} font-mono text-text-primary text-center`}>{course.bookmarkCount}</span>
            </div>
          ))}
          {topCourses.length === 0 && (
            <div className={`${bodyStyles.md} text-text-muted text-center py-8`}>No bookmarks found</div>
          )}
        </CardContent>
      </Card>

      {/* Department rankings */}
      <div className="flex items-center justify-between mb-3">
        <h2 className={`${headerStyles.xs} text-text-primary`}>Department rankings</h2>
        <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{departmentRankings.length} departments</span>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-[40px_80px_1fr_80px_1fr] px-[18px] py-2.5 bg-surface-raised border-b border-border">
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>#</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>Code</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>Name</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Marks</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>% of Total</span>
          </div>
          {departmentRankings.map((dept, i) => (
            <div
              key={dept.deptCode}
              className={`grid grid-cols-[40px_80px_1fr_80px_1fr] px-[18px] py-3 items-center hover:bg-surface-raised transition-colors ${
                i < departmentRankings.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className={`${labelStyles.md} font-mono text-text-subtle`}>{i + 1}</span>
              <span className={`${labelStyles.lg} text-text-primary`}>{dept.deptCode.toUpperCase()}</span>
              <span className={`${bodyStyles.sm} text-text-muted truncate`}>{dept.departmentName}</span>
              <span className={`${labelStyles.md} font-mono text-text-primary text-center`}>{dept.bookmarkCount}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-surface-raised overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(dept.bookmarkCount / maxDeptCount) * 100}%` }}
                  />
                </div>
                <span className={`${labelStyles.sm} font-mono text-text-subtle w-12 text-right`}>{dept.percentage}%</span>
              </div>
            </div>
          ))}
          {departmentRankings.length === 0 && (
            <div className={`${bodyStyles.md} text-text-muted text-center py-8`}>No data</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
