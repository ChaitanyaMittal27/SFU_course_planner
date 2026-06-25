"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Activity, MessageSquare, Calendar, Users, Eye, FlaskConical, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// --- Loader results per section ---
interface HealthData {
  statusLabel: string;
  statusColor: string;
  delta: string;
  deltaColor: string;
  meta: string;
  badgeLabel: string;
  badgeClass: string;
}

interface TermsData {
  meta: string;
  badgeLabel: string;
  badgeClass: string;
}

interface UsersData {
  kpiValue: string;
  kpiDelta: string;
  meta: string;
  notifValue: string;
  notifColor: string;
}

interface BookmarksData {
  meta: string;
}

interface DashboardData {
  health: HealthData | null;
  terms: TermsData | null;
  users: UsersData | null;
  bookmarks: BookmarksData | null;
}

// --- Loaders (one per section, called concurrently) ---

async function loadHealth(): Promise<HealthData> {
  const checks = await api.getHealthStatus();
  const upCount = checks.filter((c) => c.status === "up").length;
  const total = checks.length;
  const allUp = upCount === total;
  const allDown = upCount === 0;

  return {
    statusLabel: allUp ? "OK" : allDown ? "Down" : "Degraded",
    statusColor: allUp ? "text-success" : allDown ? "text-destructive" : "text-warning",
    delta: allUp ? `${total}/${total}` : `${upCount}/${total}`,
    deltaColor: allUp ? "text-success" : "text-warning",
    meta: allUp ? `${total} services up` : `${upCount}/${total} services up`,
    badgeLabel: allUp ? "OK" : `${upCount}/${total}`,
    badgeClass: allUp ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function loadTerms(): Promise<TermsData> {
  const terms = await api.getAdminTerms();
  const enrolling = terms.find((t) => t.isEnrolling);

  if (enrolling) {
    return {
      meta: `${capitalize(enrolling.term)} ${enrolling.year}`,
      badgeLabel: "Enrolling",
      badgeClass: "bg-success/15 text-success",
    };
  }

  const current = terms.find((t) => t.isCurrent);
  if (current) {
    return {
      meta: `${capitalize(current.term)} ${current.year}`,
      badgeLabel: "Current",
      badgeClass: "bg-accent/15 text-accent",
    };
  }

  return {
    meta: "No enrolling term",
    badgeLabel: "",
    badgeClass: "",
  };
}

async function loadUsers(): Promise<UsersData> {
  const res = await api.getAdminUsers();
  const { stats, users } = res;

  const eligible = users.filter((u) => u.emailNotificationsEnabled && u.preferredEmail);
  const twentyFiveHours = 25 * 60 * 60 * 1000;
  const sent = eligible.filter((u) => u.lastNotifiedAt && Date.now() - new Date(u.lastNotifiedAt).getTime() < twentyFiveHours).length;

  const notifColor =
    eligible.length === 0 ? "text-text-muted"
    : sent === eligible.length ? "text-success"
    : sent === 0 ? "text-destructive"
    : "text-warning";

  return {
    kpiValue: stats.totalUsers.toLocaleString(),
    kpiDelta: `+${stats.newThisMonth} this mo`,
    meta: `${stats.totalUsers.toLocaleString()} registered`,
    notifValue: `${sent}/${eligible.length}`,
    notifColor,
  };
}

async function loadBookmarks(): Promise<BookmarksData> {
  const res = await api.getAdminBookmarks();
  return {
    meta: `${res.stats.totalBookmarks.toLocaleString()} tracked`,
  };
}

// --- Static data (placeholder) ---

interface KpiCard {
  label: string;
  value: string;
  valueColor: string;
  delta: string;
  deltaColor: string;
}

interface SectionCard {
  key: string;
  href: string;
  icon: typeof Activity;
  desc: string;
  meta: string;
  badge?: string;
  badgeClass?: string;
  iconColorClass: string;
}

const staticSections: SectionCard[] = [
  {
    key: "Health",
    href: "/admin/health",
    icon: Activity,
    desc: "Live status checks for API, Database, CourseSys, CourseDiggers and the Resend email service.",
    meta: "Checking…",
    badge: "…",
    badgeClass: "bg-success/15 text-success",
    iconColorClass: "text-success bg-success/10 border-success/20",
  },
  {
    key: "Support",
    href: "/admin/support",
    icon: MessageSquare,
    desc: "Contact form inbox with read/unread tracking and reply functionality.",
    meta: "12 open",
    badge: "12",
    badgeClass: "bg-primary/15 text-primary",
    iconColorClass: "text-accent bg-accent/10 border-accent/20",
  },
  {
    key: "Terms",
    href: "/admin/terms",
    icon: Calendar,
    desc: "Manage which terms are current and enrolling.",
    meta: "Loading…",
    iconColorClass: "text-accent bg-accent/10 border-accent/20",
  },
  {
    key: "Users",
    href: "/admin/users",
    icon: Users,
    desc: "Total users, signup trends over time and the full users table.",
    meta: "Loading…",
    iconColorClass: "text-accent bg-accent/10 border-accent/20",
  },
  {
    key: "Bookmarks",
    href: "/admin/bookmarks",
    icon: Eye,
    desc: "Total bookmarks, most-bookmarked courses and department rankings.",
    meta: "Loading…",
    iconColorClass: "text-accent bg-accent/10 border-accent/20",
  },
  {
    key: "Test",
    href: "/admin/test",
    icon: FlaskConical,
    desc: "Manual notification trigger and endpoint tester.",
    meta: "Staging only",
    badge: "DEV",
    badgeClass: "bg-text-muted/15 text-text-muted",
    iconColorClass: "text-text-muted bg-text-muted/10 border-text-muted/20",
  },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>({ health: null, terms: null, users: null, bookmarks: null });
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    const [health, terms, users, bookmarks] = await Promise.all([
      loadHealth().catch(() => null),
      loadTerms().catch(() => null),
      loadUsers().catch(() => null),
      loadBookmarks().catch(() => null),
    ]);
    setData({ health, terms, users, bookmarks });
  }, []);

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, [loadDashboard]);

  const headingRef = useScrollReveal({ delay: 0 });
  const kpiRef = useScrollReveal({ delay: 50 });
  const cardsRef = useScrollReveal({ delay: 100 });

  const kpis: KpiCard[] = [
    {
      label: "Total Users",
      value: data.users?.kpiValue ?? "—",
      valueColor: "text-text-primary",
      delta: data.users?.kpiDelta ?? "",
      deltaColor: "text-success",
    },
    {
      label: "API Status",
      value: data.health?.statusLabel ?? "—",
      valueColor: data.health?.statusColor ?? "text-text-muted",
      delta: data.health?.delta ?? "",
      deltaColor: data.health?.deltaColor ?? "text-text-muted",
    },
    { label: "Open Tickets", value: "12", valueColor: "text-text-primary", delta: "▲ 3", deltaColor: "text-warning" },
    {
      label: "Notifications Sent",
      value: data.users?.notifValue ?? "—",
      valueColor: data.users?.notifColor ?? "text-text-muted",
      delta: "",
      deltaColor: "text-text-muted",
    },
  ];

  const sections: SectionCard[] = staticSections.map((s) => {
    if (s.key === "Health" && data.health) {
      return {
        ...s,
        meta: data.health.meta,
        badge: data.health.badgeLabel,
        badgeClass: data.health.badgeClass,
      };
    }
    if (s.key === "Terms" && data.terms) {
      return {
        ...s,
        meta: data.terms.meta,
        badge: data.terms.badgeLabel || undefined,
        badgeClass: data.terms.badgeClass || undefined,
      };
    }
    if (s.key === "Users" && data.users) {
      return { ...s, meta: data.users.meta };
    }
    if (s.key === "Bookmarks" && data.bookmarks) {
      return { ...s, meta: data.bookmarks.meta };
    }
    return s;
  });

  return (
    <div className="flex-1 p-8 max-w-[1180px]">
      {/* Page heading */}
      <div ref={headingRef} className="mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary mb-1`}>Admin overview</h1>
        <p className={`${bodyStyles.md} text-text-muted`}>
          Operational control for SFU Course Planner — pick a section to manage the platform.
        </p>
      </div>

      {/* KPI strip */}
      <div ref={kpiRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <CardContent className="p-0">
              <div className={`${labelStyles.md} text-text-muted mb-2`}>{kpi.label}</div>
              {(kpi.label === "API Status" || kpi.label === "Total Users" || kpi.label === "Notifications Sent") && loading ? (
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono font-semibold text-[23px] tracking-tight ${kpi.valueColor}`}>
                    {kpi.value}
                  </span>
                  <span className={`font-mono font-semibold ${labelStyles.sm} ${kpi.deltaColor}`}>{kpi.delta}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sections heading */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className={`${headerStyles.xs} text-text-primary`}>Sections</h2>
        <span className={`${labelStyles.sm} font-mono text-text-subtle`}>6 modules</span>
      </div>

      {/* Section cards */}
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {sections.map((section) => {
          const Icon = section.icon;
          const isLiveSection = section.key === "Health" || section.key === "Terms" || section.key === "Users" || section.key === "Bookmarks";
          const isSectionLoading = isLiveSection && loading;
          return (
            <Link key={section.key} href={section.href} className="group">
              <Card className="h-full flex flex-col p-[18px] transition-colors hover:border-border-strong hover:bg-surface-raised">
                <CardContent className="p-0 flex flex-col flex-1">
                  {/* Icon + badge row */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-[9px] border flex items-center justify-center ${section.iconColorClass}`}
                    >
                      <Icon className="w-[17px] h-[17px]" />
                    </div>
                    {section.badge && !isSectionLoading && (
                      <span
                        className={`font-mono font-semibold text-[10.5px] px-2 py-0.5 rounded-full ${section.badgeClass}`}
                      >
                        {section.badge}
                      </span>
                    )}
                    {isSectionLoading && <Skeleton className="h-5 w-10 rounded-full" />}
                  </div>

                  {/* Title */}
                  <h3 className={`${headerStyles.xs} text-text-primary mb-1`}>{section.key}</h3>

                  {/* Description */}
                  <p className={`${bodyStyles.sm} text-text-muted mb-3.5 flex-1`}>{section.desc}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    {isSectionLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{section.meta}</span>
                    )}
                    <span
                      className={`${labelStyles.md} font-semibold text-text-muted group-hover:text-text-primary flex items-center gap-1 transition-colors`}
                    >
                      Manage
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
