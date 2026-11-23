"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import { AdminPage, AdminPageHeader, AdminStats } from "@/components/admin/AdminPage";
import { adminNavigationItems } from "@/components/admin/navigation";
import { cardClass } from "@/components/course/SectionCard";
import { bodyStyles, headerStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

type HealthData = {
  statusLabel: string;
  statusColor: string;
  delta: string;
  meta: string;
};

type TermsData = { meta: string };

type UsersData = {
  kpiValue: string;
  kpiDelta: string;
  meta: string;
  notificationValue: string;
  notificationColor: string;
};

type BookmarksData = { meta: string };
type SupportData = { meta: string; unreadCount: number };
type RmpData = { meta: string };

type DashboardData = {
  health: HealthData | null;
  terms: TermsData | null;
  users: UsersData | null;
  bookmarks: BookmarksData | null;
  support: SupportData | null;
  rmp: RmpData | null;
};

type DashboardDataKey = keyof DashboardData;
type DashboardFailures = Record<DashboardDataKey, boolean>;

const emptyData: DashboardData = { health: null, terms: null, users: null, bookmarks: null, support: null, rmp: null };
const emptyFailures: DashboardFailures = { health: false, terms: false, users: false, bookmarks: false, support: false, rmp: false };

const defaultMeta = {
  health: "Checking status",
  support: "Loading support",
  terms: "Loading terms",
  users: "Loading users",
  bookmarks: "Loading bookmarks",
  rmp: "Loading reports",
} as const;

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function loadHealth(): Promise<HealthData> {
  const checks = await api.getHealthStatus();
  const total = checks.length;

  if (total === 0) {
    return {
      statusLabel: "Unavailable",
      statusColor: "text-text-muted",
      delta: "—",
      meta: "No health checks configured"
    };
  }

  const upCount = checks.filter((check) => check.status === "up").length;
  const allUp = upCount === total;
  const allDown = upCount === 0;

  return {
    statusLabel: allUp ? "OK" : allDown ? "Down" : "Degraded",
    statusColor: allUp ? "text-success-text" : allDown ? "text-destructive-text" : "text-warning-text",
    delta: `${upCount}/${total}`,
    meta: allUp ? `${total} services up` : `${upCount}/${total} services up`
  };
}

async function loadTerms(): Promise<TermsData> {
  const terms = await api.getAdminTerms();
  const enrolling = terms.find((term) => term.isEnrolling);
  if (enrolling) {
    return {
      meta: `${capitalize(enrolling.term)} ${enrolling.year}`
    };
  }

  const current = terms.find((term) => term.isCurrent);
  if (current) {
    return {
      meta: `${capitalize(current.term)} ${current.year}`
    };
  }

  return { meta: "No active term" };
}

async function loadUsers(): Promise<UsersData> {
  const { stats, users } = await api.getAdminUsers();
  const eligible = users.filter((user) => user.emailNotificationsEnabled && user.preferredEmail);
  const notificationWindowMs = 25 * 60 * 60 * 1000;
  const notifiedRecently = eligible.filter(
    (user) => user.lastNotifiedAt && Date.now() - new Date(user.lastNotifiedAt).getTime() < notificationWindowMs,
  ).length;
  const notificationColor =
    eligible.length === 0
      ? "text-text-muted"
      : notifiedRecently === eligible.length
        ? "text-success-text"
        : notifiedRecently === 0
          ? "text-destructive-text"
          : "text-warning-text";

  return {
    kpiValue: stats.totalUsers.toLocaleString(),
    kpiDelta: `+${stats.newThisMonth} this month`,
    meta: `${stats.totalUsers.toLocaleString()} registered`,
    notificationValue: `${notifiedRecently}/${eligible.length}`,
    notificationColor,
  };
}

async function loadSupport(): Promise<SupportData> {
  const { stats } = await api.getAdminSupport();
  const unreadCount = stats.unreadCount;
  return {
    meta: unreadCount > 0 ? `${unreadCount} unread` : "All caught up",
    unreadCount,
  };
}

async function loadRmp(): Promise<RmpData> {
  const reports = await api.getAdminRmpReports();
  const count = reports.length;
  return {
    meta: count > 0 ? `${count} to review` : "No open reports",
  };
}

async function loadBookmarks(): Promise<BookmarksData> {
  const { stats } = await api.getAdminBookmarks();
  return { meta: `${stats.totalBookmarks.toLocaleString()} tracked` };
}

const dashboardLoaders: { [Key in DashboardDataKey]: () => Promise<DashboardData[Key]> } = {
  health: loadHealth,
  terms: loadTerms,
  users: loadUsers,
  bookmarks: loadBookmarks,
  support: loadSupport,
  rmp: loadRmp,
};

function valueFrom<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}


export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [failures, setFailures] = useState<DashboardFailures>(emptyFailures);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<Partial<DashboardFailures>>({});

  const loadDashboard = useCallback(async () => {
    const [health, terms, users, bookmarks, support, rmp] = await Promise.allSettled([
      loadHealth(),
      loadTerms(),
      loadUsers(),
      loadBookmarks(),
      loadSupport(),
      loadRmp(),
    ]);

    setData({
      health: valueFrom(health),
      terms: valueFrom(terms),
      users: valueFrom(users),
      bookmarks: valueFrom(bookmarks),
      support: valueFrom(support),
      rmp: valueFrom(rmp),
    });
    setFailures({
      health: health.status === "rejected",
      terms: terms.status === "rejected",
      users: users.status === "rejected",
      bookmarks: bookmarks.status === "rejected",
      support: support.status === "rejected",
      rmp: rmp.status === "rejected",
    });
  }, []);

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, [loadDashboard]);

  const retrySection = useCallback(async (section: DashboardDataKey) => {
    setRetrying((current) => ({ ...current, [section]: true }));
    try {
      const value = await dashboardLoaders[section]();
      setData((current) => ({ ...current, [section]: value }) as DashboardData);
      setFailures((current) => ({ ...current, [section]: false }));
    } catch {
      setFailures((current) => ({ ...current, [section]: true }));
    } finally {
      setRetrying((current) => ({ ...current, [section]: false }));
    }
  }, []);

  if (loading) {
    return <AdminPageSkeleton statCards={4} sectionCards={6} />;
  }

  const kpis: { label: string; value: string; tone: string; delta?: string; dataKey: DashboardDataKey }[] = [
    { label: "Total users", value: data.users?.kpiValue ?? "—", tone: "text-text-primary", delta: data.users?.kpiDelta, dataKey: "users" },
    { label: "API status", value: data.health?.statusLabel ?? "—", tone: data.health?.statusColor ?? "text-text-muted", delta: data.health?.delta, dataKey: "health" },
    { label: "Unread support", value: data.support ? String(data.support.unreadCount) : "—", tone: data.support && data.support.unreadCount > 0 ? "text-warning-text" : "text-text-primary", dataKey: "support" },
    { label: "Notifications (24h)", value: data.users?.notificationValue ?? "—", tone: data.users?.notificationColor ?? "text-text-muted", dataKey: "users" },
  ];
  const failedKpis = [...new Set(kpis.filter((kpi) => failures[kpi.dataKey]).map((kpi) => kpi.dataKey))];

  return (
    <AdminPage>
      <AdminPageHeader title="Admin overview" description="Operational control for SFU Course Planner. Select a section to manage the platform." />

      <AdminStats
        items={kpis.map(({ label, value, tone, delta }) => ({
          label,
          tone,
          value: (
            <>
              {value}
              {delta && delta !== "—" && <span className={cn(bodyStyles.sm, "ml-2 font-sans font-normal text-text-muted")}>{delta}</span>}
            </>
          ),
        }))}
      />
      {failedKpis.length > 0 && (
        <div className="-mt-4 mb-6 flex flex-wrap gap-2">
          {failedKpis.map((key) => (
            <Button key={key} type="button" variant="outline" size="sm" onClick={() => retrySection(key)} disabled={retrying[key]}>
              <RefreshCw className={retrying[key] ? "animate-spin" : ""} aria-hidden="true" />
              Retry {key}
            </Button>
          ))}
        </div>
      )}

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className={cn(headerStyles.lg, "text-text-primary")}>Sections</h2>
        <span className={cn(bodyStyles.sm, "text-text-subtle")}>{adminNavigationItems.length - 1} modules</span>
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminNavigationItems.filter((section) => section.id !== "overview").map((section) => {
          const dataKey = section.id;
          const sectionData = data[dataKey];
          const failure = failures[dataKey];
          const isRetrying = retrying[dataKey];
          const meta = failure ? "Unable to load" : sectionData?.meta ?? defaultMeta[dataKey];

          return (
            <li key={section.id} className={cn(cardClass, "group relative flex flex-col transition-colors hover:border-border-strong")}>
              <div className="flex-1 p-5">
                <h3 className={cn(headerStyles.sm, "flex items-center justify-between gap-2 text-text-primary")}>
                  <Link
                    href={section.href}
                    className="underline-offset-4 group-hover:underline focus-visible:outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                  >
                    {section.label}
                  </Link>
                  <ChevronRight aria-hidden="true" className="size-4 text-text-subtle" />
                </h3>
                <p className={cn(bodyStyles.sm, "mt-1 text-text-muted")}>{section.description}</p>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
                <span className={cn(bodyStyles.sm, failure ? "text-destructive-text" : "text-text-subtle")}>{meta}</span>
                {failure && (
                  <Button type="button" variant="ghost" size="xs" onClick={() => retrySection(dataKey)} disabled={isRetrying} className="relative z-10 text-text-muted">
                    <RefreshCw className={isRetrying ? "animate-spin" : ""} aria-hidden="true" />
                    Retry
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </AdminPage>
  );
}
