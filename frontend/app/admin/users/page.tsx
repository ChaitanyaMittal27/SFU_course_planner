"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { api, AdminUsersResponse } from "@/lib/api";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AdminPage, AdminPageHeader, AdminStats, AdminTable } from "@/components/admin/AdminPage";
import SectionCard, { cardTable } from "@/components/course/SectionCard";
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

// Same chart wrapper, tokens and tooltip as the Graphs pages.
const chartConfig = { signups: { label: "Signups", color: "var(--chart-2)" } } satisfies ChartConfig;

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
            <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} minTickGap={6} />
                <YAxis allowDecimals={false} width={40} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="signups" stroke="var(--color-signups)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-signups)" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className={`${bodyStyles.md} py-12 text-center text-text-muted`}>Not enough signup history yet.</p>
          )}
      </SectionCard>

      <AdminTable title="Registered users" note={`${users.length} accounts`}>
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className={cardTable.headRow}>
                <TableHead className={cardTable.head}>User</TableHead>
                <TableHead className={cardTable.head}>Provider</TableHead>
                <TableHead className={cardTable.head}>Joined</TableHead>
                <TableHead className={cardTable.head}>Last sign-in</TableHead>
                <TableHead className={cn(cardTable.head, "text-right")}>Bookmarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={cardTable.row}>
                  <TableCell className={cardTable.cell}>
                    <Link href={`/admin/users/${user.id}`} className="group flex items-center gap-2 text-text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className={`${labelStyles.lg} max-w-64 truncate`}>{user.email}</span>
                      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-text-subtle" />
                    </Link>
                    {user.displayName && <p className={`${bodyStyles.sm} mt-0.5 text-text-muted`}>{user.displayName}</p>}
                  </TableCell>
                  <TableCell className={cardTable.cell}><Badge variant="outline">{user.provider || "email"}</Badge></TableCell>
                  <TableCell className={cn(cardTable.cell, bodyStyles.sm, "whitespace-nowrap text-text-muted")}>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className={cn(cardTable.cell, bodyStyles.sm, "whitespace-nowrap text-text-muted")}>{formatRelative(user.lastSignInAt)}</TableCell>
                  <TableCell className={cn(cardTable.cell, numericStyles.sm, "text-right text-text-primary")}>{user.bookmarkCount}</TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow className={cardTable.row}><TableCell colSpan={5} className={cn(cardTable.cell, bodyStyles.md, "py-10 text-center text-text-muted")}>No registered users found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
      </AdminTable>
    </AdminPage>
  );
}
