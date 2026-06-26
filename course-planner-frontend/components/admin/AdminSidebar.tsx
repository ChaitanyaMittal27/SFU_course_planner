"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, MessageSquare, Calendar, Users, Eye, FlaskConical, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { labelStyles, bodyStyles } from "@/app/fonts";

const navItems = [
  { label: "Health", href: "/admin/health", icon: Activity },
  { label: "Support", href: "/admin/support", icon: MessageSquare },
  { label: "Terms", href: "/admin/terms", icon: Calendar },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Bookmarks", href: "/admin/bookmarks", icon: Eye },
  { label: "Test", href: "/admin/test", icon: FlaskConical },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, setThemeTo, mounted } = useTheme();

  const isActive = (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));

  const initial = (user?.email?.trim()[0] || "A").toUpperCase();

  return (
    <aside className="hidden lg:flex w-[248px] flex-none sticky top-0 h-screen bg-sidebar border-r border-sidebar-border flex-col">
      {/* Brand */}
      <div className="px-4 pt-[18px] pb-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-[7px] bg-primary flex items-center justify-center flex-none">
            <span className="font-display font-bold text-[12px] text-primary-foreground tracking-tight">SFU</span>
          </div>
          <Link href="/admin">
            <div className="min-w-0">
              <div className="font-display font-semibold text-[13.5px] text-sidebar-foreground leading-tight">
                Course Planner
              </div>
              <span className={`${labelStyles.sm} uppercase tracking-widest text-accent`}>Admin Dashboard</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3.5 px-3">
        <div className={`${labelStyles.sm} uppercase tracking-widest text-text-subtle px-2.5 pb-2`}>Operations</div>
        <div className="flex flex-col gap-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-[11px] w-full px-2.5 py-2 rounded-lg ${labelStyles.lg} transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
                    : "text-text-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                {active && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-[17px] rounded-r-sm bg-primary" />
                )}
                <Icon className="w-[18px] h-[18px] flex-none" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-[12px] text-primary-foreground flex-none">
              {initial}
            </div>
            <span className={`${bodyStyles.sm} font-semibold text-sidebar-foreground truncate`}>
              {user?.email || "admin"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
