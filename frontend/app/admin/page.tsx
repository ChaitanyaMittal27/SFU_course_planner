"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import { AdminPage, AdminPageHeader, AdminStatGrid } from "@/components/admin/AdminPage";
import { adminNavigationItems } from "@/components/admin/navigation";
import { bodyStyles, displayStyles, headerStyles, labelStyles } from "@/app/fonts";
import { useScrollReveal } from "@/hooks/useScrollReveal";

type StatusBadge = { label: string; className: string };

type HealthData = {
  statusLabel: string;
  statusColor: string;
  delta: string;
  deltaColor: string;
  meta: string;
  badge: StatusBadge;
};

type TermsData = { meta: string; badge?: StatusBadge };

type UsersData = {
  kpiValue: string;
  kpiDelta: string;
  meta: string;
  notificationValue: string;
  notificationColor: string;
};

type BookmarksData = { meta: string };
type SupportData = { meta: string; badge?: StatusBadge; unreadCount: number };
type RmpData = { meta: string; badge?: StatusBadge };

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

const dashboardPresentation = {
  health: { iconClass: "border-success/20 bg-success/10 text-success", defaultMeta: "Checking status" },
  support: { iconClass: "border-accent/20 bg-accent/10 text-accent", defaultMeta: "Loading support" },
  terms: { iconClass: "border-accent/20 bg-accent/10 text-accent", defaultMeta: "Loading terms" },
  users: { iconClass: "border-accent/20 bg-accent/10 text-accent", defaultMeta: "Loading users" },
  bookmarks: { iconClass: "border-accent/20 bg-accent/10 text-accent", defaultMeta: "Loading bookmarks" },
  rmp: { iconClass: "border-accent/20 bg-accent/10 text-accent", defaultMeta: "Loading reports" },
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
      deltaColor: "text-text-muted",
      meta: "No health checks configured",
      badge: { label: "No checks", className: "bg-text-muted/15 text-text-muted" },
    };
  }

  const upCount = checks.filter((check) => check.status === "up").length;
  const allUp = upCount === total;
  const allDown = upCount === 0;

  return {
    statusLabel: allUp ? "OK" : allDown ? "Down" : "Degraded",
    statusColor: allUp ? "text-success" : allDown ? "text-destructive" : "text-warning",
    delta: `${upCount}/${total}`,
    deltaColor: allUp ? "text-success" : allDown ? "text-destructive" : "text-warning",
    meta: allUp ? `${total} services up` : `${upCount}/${total} services up`,
    badge: {
      label: allUp ? "OK" : `${upCount}/${total}`,
      className: allUp ? "bg-success/15 text-success" : allDown ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning",
    },
  };
}

async function loadTerms(): Promise<TermsData> {
  const terms = await api.getAdminTerms();
  const enrolling = terms.find((term) => term.isEnrolling);
  if (enrolling) {
    return {
      meta: `${capitalize(enrolling.term)} ${enrolling.year}`,
      badge: { label: "Enrolling", className: "bg-success/15 text-success" },
    };
  }

  const current = terms.find((term) => term.isCurrent);
  if (current) {
    return {
      meta: `${capitalize(current.term)} ${current.year}`,
      badge: { label: "Current", className: "bg-accent/15 text-accent" },
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
        ? "text-success"
        : notifiedRecently === 0
          ? "text-destructive"
          : "text-warning";

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
    badge: unreadCount > 0 ? { label: String(unreadCount), className: "bg-primary/15 text-primary" } : undefined,
    unreadCount,
  };
}

async function loadRmp(): Promise<RmpData> {
  const reports = await api.getAdminRmpReports();
  const count = reports.length;
  return {
    meta: count > 0 ? `${count} to review` : "No open reports",
    badge: count > 0 ? { label: String(count), className: "bg-warning/15 text-warning" } : undefined,
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

function badgeFrom(data: Exclude<DashboardData[DashboardDataKey], null> | null): StatusBadge | undefined {
  return data && "badge" in data ? data.badge : undefined;
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

  const headingRef = useScrollReveal({ delay: 0 });
  const kpiRef = useScrollReveal({ delay: 50 });
  const cardsRef = useScrollReveal({ delay: 100 });

  if (loading) {
    return <AdminPageSkeleton statCards={4} />;
  }

  const kpis = [
    { label: "Total users", value: data.users?.kpiValue ?? "—", valueColor: "text-text-primary", delta: data.users?.kpiDelta ?? "", deltaColor: "text-success", dataKey: "users" as const },
    { label: "API status", value: data.health?.statusLabel ?? "—", valueColor: data.health?.statusColor ?? "text-text-muted", delta: data.health?.delta ?? "", deltaColor: data.health?.deltaColor ?? "text-text-muted", dataKey: "health" as const },
    { label: "Unread support", value: data.support ? String(data.support.unreadCount) : "—", valueColor: data.support && data.support.unreadCount > 0 ? "text-warning" : "text-text-primary", delta: "", deltaColor: "text-text-muted", dataKey: "support" as const },
    { label: "Notifications (24h)", value: data.users?.notificationValue ?? "—", valueColor: data.users?.notificationColor ?? "text-text-muted", delta: "", deltaColor: "text-text-muted", dataKey: "users" as const },
  ];

  return (
    <AdminPage>
      <div ref={headingRef}>
        <AdminPageHeader title="Admin overview" description="Operational control for SFU Course Planner. Select a section to manage the platform." />
      </div>

      <div ref={kpiRef}>
        <AdminStatGrid>
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="p-4">
              <CardContent className="p-0">
                <p className={`${labelStyles.md} mb-2 text-text-muted`}>{kpi.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className={`${displayStyles.sm} font-mono tracking-tight ${kpi.valueColor}`}>{kpi.value}</span>
                  {kpi.delta && <span className={`${labelStyles.sm} font-mono ${kpi.deltaColor}`}>{kpi.delta}</span>}
                </div>
                {failures[kpi.dataKey] && (
                  <Button type="button" variant="link" size="xs" onClick={() => retrySection(kpi.dataKey)} disabled={retrying[kpi.dataKey]} className="mt-2 px-0 text-text-muted">
                    <RefreshCw className={retrying[kpi.dataKey] ? "animate-spin" : ""} />
                    Retry
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </AdminStatGrid>
      </div>

      <div className="mb-3.5 flex items-center justify-between">
        <h2 className={`${headerStyles.xs} text-text-primary`}>Sections</h2>
        <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{adminNavigationItems.length - 1} modules</span>
      </div>

      <div ref={cardsRef} className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {adminNavigationItems.filter((section) => section.id !== "overview").map((section) => {
          const Icon = section.icon;
          const dataKey = section.id;
          const sectionData = data[dataKey];
          const failure = failures[dataKey];
          const isRetrying = retrying[dataKey];
          const badge = badgeFrom(sectionData);
          const presentation = dashboardPresentation[section.id];
          const meta = failure ? "Unable to load" : sectionData?.meta ?? presentation.defaultMeta;

          return (
            <Card key={section.id} className="flex h-full flex-col p-5 transition-colors hover:border-border-strong hover:bg-surface-raised">
              <CardContent className="flex flex-1 flex-col p-0">
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex size-9 items-center justify-center rounded-lg border ${presentation.iconClass}`}>
                    <Icon className="size-4" />
                  </div>
                  {badge && <span className={`${labelStyles.sm} rounded-full px-2 py-0.5 font-mono font-semibold ${badge.className}`}>{badge.label}</span>}
                </div>

                <h3 className={`${headerStyles.xs} mb-1 text-text-primary`}>{section.label}</h3>
                <p className={`${bodyStyles.sm} mb-3.5 flex-1 text-text-muted`}>{section.description}</p>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className={`${labelStyles.sm} font-mono ${failure ? "text-destructive" : "text-text-subtle"}`}>{meta}</span>
                  <div className="flex items-center gap-2">
                    {failure && (
                      <Button type="button" variant="link" size="xs" onClick={() => retrySection(dataKey)} disabled={isRetrying} className="px-0 text-text-muted">
                        <RefreshCw className={isRetrying ? "animate-spin" : ""} />
                        Retry
                      </Button>
                    )}
                    <Link href={section.href} className={`${labelStyles.md} flex items-center gap-1 font-semibold text-text-muted transition-colors hover:text-text-primary`}>
                      Manage
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminPage>
  );
}
