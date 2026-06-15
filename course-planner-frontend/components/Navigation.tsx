"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  BarChart2,
  ClipboardList,
  Info,
  BookOpen,
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
import { headerStyles, labelStyles } from "@/app/fonts";

const navLinks = [
  { name: "Browse", href: "/browse", icon: Search },
  { name: "Graph", href: "/graph", icon: BarChart2 },
  { name: "Compare", href: "/compare", icon: ClipboardList },
  { name: "About", href: "/about", icon: Info },
  { name: "API Docs", href: "/docs", icon: BookOpen },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const { user, signOut } = useAuth();

  const isActive = (href: string) => pathname === href;

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-30 bg-nav-bg shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/favicon.png" alt="SFU Course Planner" className="w-8 h-8" />
            <span className={`${headerStyles.md} text-white`}>SFU Course Planner</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ name, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="relative flex items-center gap-1.5 py-1 text-white transition-all duration-200 group hover:text-white/80"
                title={name}
              >
                <Icon className="w-5 h-5" />
                <span
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-white transition-all duration-200 ${
                    isActive(href) ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                  }`}
                />
              </Link>
            ))}

            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="text-white hover:text-white/80 hover:bg-white/10"
              >
                {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>
            )}

            {/* Auth */}
            {!user ? (
              <Link
                href="/login"
                className={`${labelStyles.lg} px-4 py-1.5 bg-background text-primary rounded-md font-medium hover:bg-background/90 transition-colors`}
              >
                Sign In
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors"
                  aria-label="Profile menu"
                >
                  <div className="w-8 h-8 bg-background text-primary rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                    {getUserInitials()}
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
                  <div className="px-3 py-2">
                    <p className={`${labelStyles.lg} text-text-primary truncate`}>{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
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
            className="md:hidden text-white hover:text-white/80 hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 animate-fade-in border-t border-white/20 pt-3">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ name, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${labelStyles.lg} px-3 py-2 text-white transition-all rounded flex items-center gap-2 ${
                    isActive(href) ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {name}
                </Link>
              ))}

              {/* Theme Toggle (mobile) */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className={`${labelStyles.lg} px-3 py-2 text-white text-left hover:bg-white/10 flex items-center justify-between rounded`}
                >
                  <span className="flex items-center gap-2">
                    {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    Switch Theme
                  </span>
                </button>
              )}

              {/* Mobile Auth */}
              <div className="pt-2 border-t border-white/20 mt-2">
                {!user ? (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${labelStyles.lg} px-3 py-2 bg-background text-primary rounded flex items-center justify-center font-medium`}
                  >
                    Sign In
                  </Link>
                ) : (
                  <>
                    <div className={`${labelStyles.md} px-3 py-2 text-white/80`}>{user.email}</div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${labelStyles.lg} px-3 py-2 text-white hover:bg-white/10 flex items-center gap-2 rounded`}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className={`${labelStyles.lg} w-full px-3 py-2 text-destructive hover:bg-white/10 flex items-center gap-2 rounded`}
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
      </div>
    </nav>
  );
}
