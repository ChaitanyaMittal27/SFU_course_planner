"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { adminNavigationItems } from "@/components/admin/navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Counts = Partial<Record<"support" | "rmp", number>>;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

/** Unread support messages and open RMP reports, for the sidebar badges. Failures show no badge. */
function useAdminCounts(): Counts {
  const [counts, setCounts] = useState<Counts>({});
  useEffect(() => {
    let active = true;
    api
      .getAdminSupport()
      .then((data) => active && setCounts((prev) => ({ ...prev, support: data.stats.unreadCount })))
      .catch(() => undefined);
    api
      .getAdminRmpReports()
      .then((reports) => active && setCounts((prev) => ({ ...prev, rmp: reports.length })))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return counts;
}

function AdminBrand() {
  return (
    <Link href="/admin" className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <span aria-hidden="true" className={cn(labelStyles.sm, "flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground")}>
        SFU
      </span>
      <span className="min-w-0">
        <span className={cn(labelStyles.lg, "block truncate text-text-primary")}>Course Planner</span>
        <span className={cn(labelStyles.sm, "block uppercase tracking-widest text-text-subtle")}>Administration</span>
      </span>
    </Link>
  );
}

function AdminNavigationLinks({ counts, onNavigate }: { counts: Counts; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation">
      <p className={cn(labelStyles.sm, "mb-2 px-3 uppercase tracking-widest text-text-subtle")}>Operations</p>
      <ul className="flex flex-col gap-0.5">
        {adminNavigationItems.map(({ id, label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          const count = id === "support" || id === "rmp" ? counts[id] : undefined;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  labelStyles.lg,
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active ? "bg-surface-raised text-text-primary" : "text-text-muted hover:bg-surface-raised hover:text-text-primary"
                )}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {count !== undefined && count > 0 && (
                  <span className={cn(numericStyles.sm, "rounded-full bg-destructive-tint px-1.5 font-semibold text-destructive-text")} aria-label={`${count} open`}>
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function AdminFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const initial = (user?.email?.trim()[0] || "A").toUpperCase();
  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback className={cn(labelStyles.sm, "bg-surface-raised text-text-primary")}>{initial}</AvatarFallback>
        </Avatar>
        <span className={cn(bodyStyles.sm, "truncate text-text-primary")}>{user?.email || "Administrator"}</span>
      </div>
      <Link href="/" onClick={onNavigate} className={cn(labelStyles.md, "flex items-center gap-2 text-text-muted hover:text-text-primary")}>
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back to site
      </Link>
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const counts = useAdminCounts();
  // Open only for the path it was opened on, so navigating closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const mobileOpen = menuPath === pathname;

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-[var(--app-nav-height)] z-20 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border p-4">
          <AdminBrand />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <AdminNavigationLinks counts={counts} />
        </div>
        <div className="border-t border-border p-4">
          <AdminFooter />
        </div>
      </aside>

      <header className="sticky top-[var(--app-nav-height)] z-20 flex h-[var(--admin-mobile-header-height)] items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <AdminBrand />
        <Sheet open={mobileOpen} onOpenChange={(open) => setMenuPath(open ? pathname : null)}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open admin navigation" />}>
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 gap-0 bg-surface p-0">
            <div className="border-b border-border p-4">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <AdminBrand />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <AdminNavigationLinks counts={counts} onNavigate={() => setMenuPath(null)} />
            </div>
            <div className="border-t border-border p-4">
              <AdminFooter onNavigate={() => setMenuPath(null)} />
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
