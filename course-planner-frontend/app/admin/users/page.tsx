"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users as UsersIcon, UserPlus, Bell, Activity, Send } from "lucide-react";
import { api, AdminUsersResponse, AdminUser } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorMessage from "@/components/ErrorMessage";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const TWENTY_FIVE_HOURS_MS = 25 * 60 * 60 * 1000;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelative(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

function isNotifiedRecently(lastNotifiedAt: string | null): boolean {
  if (!lastNotifiedAt) return false;
  return Date.now() - new Date(lastNotifiedAt).getTime() < TWENTY_FIVE_HOURS_MS;
}

function buildSignupChart(users: AdminUser[]) {
  const counts: Record<string, number> = {};
  for (const u of users) {
    const d = new Date(u.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      const [y, m] = month.split("-");
      const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      return { month: label, signups: count };
    });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const result = await api.getAdminUsers();
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      setError(message);
    }
  }, []);

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, [fetchUsers]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return buildSignupChart(data.users);
  }, [data]);

  const eligibleUsers = useMemo(() => {
    if (!data) return [];
    return data.users.filter((u) => u.emailNotificationsEnabled && u.preferredEmail);
  }, [data]);

  const sentCount = useMemo(() => {
    return eligibleUsers.filter((u) => isNotifiedRecently(u.lastNotifiedAt)).length;
  }, [eligibleUsers]);

  if (loading) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <div className="mb-6">
          <Skeleton className="h-8 w-52 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl mb-8" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <ErrorMessage message={error} onRetry={fetchUsers} />
      </div>
    );
  }

  if (!data) return null;

  const { stats, users } = data;

  const notifSentColor =
    eligibleUsers.length === 0 ? "text-text-muted"
    : sentCount === eligibleUsers.length ? "text-success"
    : sentCount === 0 ? "text-destructive"
    : "text-warning";

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: UsersIcon, color: "text-accent" },
    { label: "New This Month", value: `+${stats.newThisMonth}`, icon: UserPlus, color: "text-success" },
    { label: "Notifications On", value: String(stats.optedInNotifications), icon: Bell, color: "text-warning" },
    { label: "Active (30d)", value: String(stats.activeInLast30Days), icon: Activity, color: "text-success" },
    { label: "Notifications Sent", value: eligibleUsers.length > 0 ? `${sentCount}/${eligibleUsers.length}` : "0/0", icon: Send, color: notifSentColor },
  ];

  return (
    <div className="flex-1 p-8 max-w-[1180px]">
      {/* Heading */}
      <div className="mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary mb-1`}>User Management</h1>
        <p className={`${bodyStyles.md} text-text-muted`}>
          User analytics, signup trends and account details.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Signups chart */}
      {chartData.length > 1 && (
        <Card className="p-5 mb-8">
          <CardContent className="p-0">
            <h2 className={`${headerStyles.xs} text-text-primary mb-4`}>Signups over time</h2>
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
                    dataKey="signups"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--primary)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users table */}
      <div className="flex items-center justify-between mb-3">
        <h2 className={`${headerStyles.xs} text-text-primary`}>All users</h2>
        <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{users.length} users</span>
      </div>

      <Card className="overflow-hidden mb-8">
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-[1fr_90px_100px_90px_80px_70px] px-[18px] py-2.5 bg-surface-raised border-b border-border">
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>Email</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Provider</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Joined</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Last Seen</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Notifs</span>
            <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Marks</span>
          </div>
          {/* Rows */}
          {users.map((user, i) => (
            <div
              key={user.id}
              onClick={() => router.push(`/admin/users/${user.id}`)}
              className={`grid grid-cols-[1fr_90px_100px_90px_80px_70px] px-[18px] py-3 items-center cursor-pointer hover:bg-surface-raised transition-colors ${
                i < users.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="min-w-0">
                <span className={`${labelStyles.lg} text-text-primary truncate block`}>{user.email}</span>
                {user.displayName && (
                  <span className={`${bodyStyles.sm} text-text-subtle truncate block`}>{user.displayName}</span>
                )}
              </div>
              <div className="flex items-center justify-center">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  user.provider === "google"
                    ? "bg-accent/15 text-accent"
                    : "bg-text-muted/15 text-text-muted"
                }`}>
                  {user.provider === "google" ? "Google" : "Email"}
                </span>
              </div>
              <div className={`${labelStyles.sm} font-mono text-text-subtle text-center`}>
                {formatDate(user.createdAt)}
              </div>
              <div className={`${labelStyles.sm} font-mono text-text-subtle text-center`}>
                {formatRelative(user.lastSignInAt)}
              </div>
              <div className="flex items-center justify-center">
                {user.emailNotificationsEnabled ? (
                  <span className="w-2 h-2 rounded-full bg-success" />
                ) : (
                  <span className="text-text-subtle text-[16px]">—</span>
                )}
              </div>
              <div className={`${labelStyles.md} font-mono text-text-primary text-center`}>
                {user.bookmarkCount}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className={`${bodyStyles.md} text-text-muted text-center py-8`}>No users found</div>
          )}
        </CardContent>
      </Card>

      {/* Notification Status */}
      <div className="flex items-center justify-between mb-3">
        <h2 className={`${headerStyles.xs} text-text-primary`}>Notification Status</h2>
        <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{eligibleUsers.length} eligible</span>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {eligibleUsers.length > 0 ? (
            <>
              <div className="grid grid-cols-[1fr_1fr_100px_100px] px-[18px] py-2.5 bg-surface-raised border-b border-border">
                <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>Email</span>
                <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>Preferred Email</span>
                <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Last Notified</span>
                <span className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle text-center`}>Status</span>
              </div>
              {eligibleUsers.map((user, i) => {
                const notified = isNotifiedRecently(user.lastNotifiedAt);
                return (
                  <div
                    key={user.id}
                    className={`grid grid-cols-[1fr_1fr_100px_100px] px-[18px] py-3 items-center hover:bg-surface-raised transition-colors ${
                      i < eligibleUsers.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <span className={`${labelStyles.lg} text-text-primary truncate`}>{user.email}</span>
                    <span className={`${labelStyles.md} font-mono text-text-muted truncate`}>{user.preferredEmail}</span>
                    <div className={`${labelStyles.sm} font-mono text-text-subtle text-center`}>
                      {formatRelative(user.lastNotifiedAt)}
                    </div>
                    <div className="flex items-center justify-center">
                      {notified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success">
                          Notified ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning">
                          Missed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className={`${bodyStyles.md} text-text-muted text-center py-8`}>
              No users have notifications configured
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
