"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  BarChart2,
  ClipboardList,
  Info,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { labelStyles, buttonStyles } from "@/app/fonts";

const navLinks = [
  { name: "Browse", href: "/browse", icon: Search },
  { name: "Graph", href: "/graph", icon: BarChart2 },
  { name: "Compare", href: "/compare", icon: ClipboardList },
  { name: "About", href: "/about", icon: Info },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, setThemeTo, mounted } = useTheme();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const isAdmin = user?.app_metadata?.role === "admin";

  const isActive = (href: string) => pathname === href;

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-30 bg-nav-bg border-b border-nav-border">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7 h-[var(--app-nav-height)] flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-[30px] h-[30px] rounded-[7px] bg-primary flex items-center justify-center">
            <span className="font-display font-bold text-[13px] text-primary-foreground tracking-tight">
              SFU
            </span>
          </div>
          <span className="font-display font-semibold text-[15.5px] text-nav-text tracking-tight">
            Course Planner
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map(({ name, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`relative flex items-center gap-[7px] px-3 py-2 rounded-[7px] ${buttonStyles.md} transition-colors hover:bg-[rgba(127,127,127,0.10)] ${
                isActive(href) ? "text-nav-text" : "text-nav-muted hover:text-nav-text"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{name}</span>
              {isActive(href) && (
                <span className="absolute left-3 right-3 bottom-0 h-0.5 rounded-sm bg-nav-active" />
              )}
            </Link>
          ))}
        </div>

        {/* Right cluster */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {/* Segmented theme toggle */}
          {mounted && (
            <div className="flex items-center gap-0.5 p-[3px] rounded-lg bg-[rgba(127,127,127,0.14)]" role="group" aria-label="Color theme">
              <button
                type="button"
                onClick={() => setThemeTo("light")}
                aria-label="Use light theme"
                aria-pressed={theme === "light"}
                className={`w-[30px] h-[26px] rounded-md flex items-center justify-center transition-colors ${
                  theme === "light"
                    ? "bg-nav-text text-nav-bg"
                    : "bg-transparent text-nav-muted"
                }`}
              >
                <Sun className="w-[15px] h-[15px]" />
              </button>
              <button
                type="button"
                onClick={() => setThemeTo("dark")}
                aria-label="Use dark theme"
                aria-pressed={theme === "dark"}
                className={`w-[30px] h-[26px] rounded-md flex items-center justify-center transition-colors ${
                  theme === "dark"
                    ? "bg-nav-text text-nav-bg"
                    : "bg-transparent text-nav-muted"
                }`}
              >
                <Moon className="w-[15px] h-[15px]" />
              </button>
            </div>
          )}

          {/* Auth */}
          {authLoading ? (
            <div className="h-8 w-24" aria-hidden="true" />
          ) : !user ? (
            <>
              <Link
                href="/login"
                className={`${buttonStyles.md} font-medium text-nav-text py-2 px-1.5`}
              >
                Sign in
              </Link>
              <Link
                href="/login?tab=signup"
                className={`${buttonStyles.md} font-semibold text-primary-foreground bg-primary py-2 px-4 rounded-lg`}
              >
                Sign up
              </Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-1.5 text-nav-text hover:text-nav-muted transition-colors"
                aria-label="Profile menu"
              >
                <div className="w-8 h-8 bg-surface-raised text-text-primary rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                  {getUserInitials()}
                </div>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
                <div className="px-3 py-2">
                  <p className={`${labelStyles.lg} text-text-primary truncate`}>{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => router.push("/admin")}
                    className="flex items-center gap-2 text-text-muted cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 text-text-muted cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-nav-text hover:text-nav-muted hover:bg-[rgba(127,127,127,0.10)]"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation-menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-menu" className="md:hidden pb-3 animate-fade-in border-t border-nav-muted/20 pt-3 px-4 sm:px-7">
          <div className="flex flex-col gap-1">
            {navLinks.map(({ name, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive(href) ? "page" : undefined}
                className={`${labelStyles.lg} px-3 py-2 text-nav-text transition-all rounded flex items-center gap-2 ${
                  isActive(href) ? "bg-nav-text/20" : "hover:bg-nav-text/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                {name}
              </Link>
            ))}

            {/* Theme Toggle (mobile) */}
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Use dark theme" : "Use light theme"}
                className={`${labelStyles.lg} px-3 py-2 text-nav-text text-left hover:bg-nav-text/10 flex items-center justify-between rounded`}
              >
                <span className="flex items-center gap-2">
                  {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  Switch Theme
                </span>
              </button>
            )}

            {/* Mobile Auth */}
            <div className="pt-2 border-t border-nav-text/20 mt-2">
              {authLoading ? (
                <div className="h-10" aria-hidden="true" />
              ) : !user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${labelStyles.lg} px-3 py-2 text-nav-text hover:bg-nav-text/10 rounded text-center`}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/login?tab=signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${labelStyles.lg} px-3 py-2 bg-primary text-primary-foreground rounded flex items-center justify-center font-medium`}
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <>
                  <div className={`${labelStyles.md} px-3 py-2 text-nav-muted`}>{user.email}</div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${labelStyles.lg} px-3 py-2 text-nav-text hover:bg-nav-text/10 flex items-center gap-2 rounded`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${labelStyles.lg} px-3 py-2 text-nav-text hover:bg-nav-text/10 flex items-center gap-2 rounded`}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className={`${labelStyles.lg} w-full px-3 py-2 text-destructive-text hover:bg-nav-text/10 flex items-center gap-2 rounded`}
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
