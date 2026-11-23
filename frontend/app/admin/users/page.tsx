"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, AdminUsersResponse } from "@/lib/api";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import { AdminPage, AdminPageHeader, AdminStats, AdminTable } from "@/components/admin/AdminPage";
import SectionCard from "@/components/course/SectionCard";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const RECENT_NOTIFICATION_WINDOW_MS = 25 * 60 * 60 * 1000;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(value: string | null) {
  if (!value) return "Never";

  const days = Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(value);
}

function buildSignupChart(createdAt: string[]) {
  const counts = new Map<string, number>();

  for (const created of createdAt) {
    const date = new Date(created);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, signups]) => ({
      month: new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-CA", { month: "short", year: "2-digit" }),
      signups,
    }));
}

export default function AdminUsersPage() {
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceTime, setReferenceTime] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const result = await api.getAdminUsers();
      setData(result);
      setReferenceTime(new Date().getTime());
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, "Failed to load user analytics."));
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const result = await api.getAdminUsers();
        if (active) {
          setError(null);
          setData(result);
          setReferenceTime(new Date().getTime());
        }
      } catch (requestError: unknown) {
        if (active) setError(errorMessage(requestError, "Failed to load user analytics."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUsers();
    return () => { active = false; };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const chartData = useMemo(
    () => buildSignupChart(data?.users.map((user) => user.createdAt) ?? []),
    [data],
  );

  if (loading) return <AdminPageSkeleton statCards={5} hasChart hasTable tableRows={8} />;

  const actions = (
    <Button type="button" onClick={handleRefresh} disabled={refreshing} className="gap-2">
      <RefreshCw className={refreshing ? "animate-spin" : ""} />
      Refresh
    </Button>
  );

  if (error && !data) {
    return (
      <AdminPage>
        <AdminPageHeader title="Users" description="Review registered accounts, signup activity, and notification preferences." actions={actions} />
        <ErrorMessage message={error} onRetry={handleRefresh} />
      </AdminPage>
    );
  }

  if (!data) return null;

  const { stats, users } = data;
  const recentlyNotified = users.filter((user) => {
    if (!user.lastNotifiedAt) return false;
    return referenceTime - new Date(user.lastNotifiedAt).getTime() <= RECENT_NOTIFICATION_WINDOW_MS;
  }).length;

  const statItems = [
    { label: "Total users", value: stats.totalUsers.toLocaleString() },
    { label: "New this month", value: stats.newThisMonth.toLocaleString() },
    { label: "Notification opt-ins", value: stats.optedInNotifications.toLocaleString() },
    { label: "Active in 30 days", value: stats.activeInLast30Days.toLocaleString() },
    { label: "Notified (25h)", value: recentlyNotified.toLocaleString() },
  ];

  return (
    <AdminPage>
      <AdminPageHeader title="Users" description="Review registered accounts, signup activity, and notification preferences." actions={actions} />

      {error && <ErrorMessage className="mb-6" message={error} onRetry={handleRefresh} />}

      <AdminStats items={statItems} />

      <SectionCard title="New accounts over time" className="mb-6">
          {chartData.length > 1 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12 }} labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }} />
                  <Line type="monotone" dataKey="signups" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--accent)" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`${bodyStyles.md} py-12 text-center text-text-muted`}>Not enough signup history yet.</p>
          )}
      </SectionCard>

      <AdminTable title="Registered users" note={`${users.length} accounts`}>
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-surface-raised">
              <tr className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
                <th className="px-4 py-3 text-right font-medium">Bookmarks</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border hover:bg-surface-raised">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="group flex items-center gap-2 text-text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className={`${labelStyles.lg} max-w-64 truncate`}>{user.email}</span>
                      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-text-subtle" />
                    </Link>
                    {user.displayName && <p className={`${bodyStyles.sm} mt-0.5 text-text-muted`}>{user.displayName}</p>}
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline">{user.provider || "email"}</Badge></td>
                  <td className={`${bodyStyles.sm} whitespace-nowrap px-4 py-3 text-text-muted`}>{formatDate(user.createdAt)}</td>
                  <td className={`${bodyStyles.sm} whitespace-nowrap px-4 py-3 text-text-muted`}>{formatRelative(user.lastSignInAt)}</td>
                  <td className={`${numericStyles.sm} px-4 py-3 text-right text-text-primary`}>{user.bookmarkCount}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className={`${bodyStyles.md} px-4 py-10 text-center text-text-muted`}>No registered users found.</td></tr>
              )}
            </tbody>
          </table>
      </AdminTable>
    </AdminPage>
  );
}
