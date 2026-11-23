"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, Moon, Shield, Sun } from "lucide-react";
import { bodyStyles, buttonStyles, headerStyles, labelStyles } from "@/app/fonts";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// `match` is the section prefix that marks the link active; href is the section's default page.
const navLinks = [
  { name: "Browse", href: "/browse", match: "/browse" },
  { name: "Graphs", href: "/graph/load", match: "/graph" },
  { name: "Compare", href: "/compare/courses", match: "/compare" },
  { name: "About", href: "/about", match: "/about" },
];

function isActivePath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  // Same-size placeholder until the stored theme is known, so the bar doesn't shift.
  if (!mounted) return <span aria-hidden="true" className="inline-block size-8 shrink-0" />;
  const next = theme === "light" ? "dark" : "light";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      className="text-nav-muted hover:text-nav-text"
    >
      {theme === "light" ? <Moon /> : <Sun />}
    </Button>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const isAdmin = user?.app_metadata?.role === "admin";
  const initial = user?.email?.charAt(0).toUpperCase() ?? "U";

  // The sheet counts as open only on the path it was opened from, so any navigation closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const mobileOpen = menuPath === pathname;
  const closeMobile = () => setMenuPath(null);

  return (
    <nav aria-label="Main" className="sticky top-0 z-30 border-b border-nav-border bg-nav-bg">
      <div className="mx-auto flex h-[var(--app-nav-height)] max-w-page items-center justify-between gap-6 px-4 sm:px-7">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden="true"
            className={cn(labelStyles.sm, "flex size-8 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground")}
          >
            SFU
          </span>
          <span className={cn(headerStyles.sm, "text-nav-text")}>Course Planner</span>
        </Link>

        <ul className="hidden flex-1 items-center gap-1 md:flex">
          {navLinks.map(({ name, href, match }) => {
            const active = isActivePath(pathname, match);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    buttonStyles.md,
                    "relative flex h-[var(--app-nav-height)] items-center px-3 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50",
                    active ? "text-nav-text" : "text-nav-muted hover:text-nav-text"
                  )}
                >
                  {name}
                  {active && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-0.5 bg-nav-active" />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <ThemeToggle />
          {authLoading ? (
            <span aria-hidden="true" className="inline-block h-8 w-36" />
          ) : !user ? (
            <>
              <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                Sign in
              </Link>
              <Link href="/login?tab=signup" className={buttonVariants()}>
                Sign up
              </Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Avatar>
                  <AvatarFallback className={cn(labelStyles.md, "bg-surface-raised text-text-primary")}>{initial}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className={cn(bodyStyles.sm, "truncate text-text-muted")}>{user.email}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  <LayoutDashboard />
                  Dashboard
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    <Shield />
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Sheet open={mobileOpen} onOpenChange={(open) => setMenuPath(open ? pathname : null)}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" aria-label="Open menu" className="text-nav-text md:hidden" />}
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 gap-0 bg-background p-0">
            <SheetHeader className="border-b border-border px-4 py-3">
              <SheetTitle className={headerStyles.sm}>Menu</SheetTitle>
            </SheetHeader>

            <ul className="flex flex-col p-2">
              {navLinks.map(({ name, href, match }) => {
                const active = isActivePath(pathname, match);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={closeMobile}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        labelStyles.lg,
                        "flex items-center rounded-md border-l-2 px-3 py-2.5 transition-colors hover:bg-surface",
                        active ? "border-nav-active text-text-primary" : "border-transparent text-text-muted"
                      )}
                    >
                      {name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Separator />
            <div className="flex items-center justify-between px-4 py-3">
              <span className={cn(labelStyles.lg, "text-text-muted")}>Theme</span>
              <ThemeToggle />
            </div>
            <Separator />

            <div className="flex flex-col gap-2 p-4">
              {authLoading ? null : !user ? (
                <>
                  <Link href="/login" onClick={closeMobile} className={buttonVariants({ variant: "outline", size: "lg" })}>
                    Sign in
                  </Link>
                  <Link href="/login?tab=signup" onClick={closeMobile} className={buttonVariants({ size: "lg" })}>
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  <p className={cn(bodyStyles.sm, "truncate pb-1 text-text-muted")}>{user.email}</p>
                  <Link
                    href="/dashboard"
                    onClick={closeMobile}
                    className={buttonVariants({ variant: "ghost", className: "justify-start" })}
                  >
                    <LayoutDashboard />
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={closeMobile}
                      className={buttonVariants({ variant: "ghost", className: "justify-start" })}
                    >
                      <Shield />
                      Admin
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive-text"
                    onClick={() => {
                      closeMobile();
                      void signOut();
                    }}
                  >
                    <LogOut />
                    Sign out
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
