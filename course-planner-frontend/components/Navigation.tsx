/**
 * =============================================================================
 * NAVIGATION - AUTH-AWARE NAVBAR
 * =============================================================================
 *
 * Changes from original:
 * 1. Removed "Watchers" link (moved to dashboard)
 * 2. Added auth state detection via useAuth()
 * 3. When logged out: Shows "Sign In" button
 * 4. When logged in: Shows profile picture dropdown with:
 *    - Dashboard
 *    - Sign Out
 *
 * Why these changes?
 * - "Watchers" is user-specific, not a public feature → belongs in dashboard
 * - Need visible way to access dashboard after login
 * - Need visible way to sign out
 * - Profile dropdown is standard UX pattern for authenticated apps
 *
 * Connection:
 * - Uses: useAuth() hook from AuthContext
 * - Links to: /login, /dashboard
 * - Calls: signOut() from AuthContext
 * =============================================================================
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();
  const { user, signOut } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Public navigation links
   * Removed "Watchers" - now accessed via Dashboard
   */
  const navLinks = [
    {
      name: "Browse",
      href: "/browse",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      name: "Graph",
      href: "/graph",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      name: "Compare",
      href: "/compare",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      name: "About",
      href: "/about",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      name: "Docs",
      href: "/docs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => pathname === href;

  /**
   * Close dropdown when clicking outside
   * Standard UX pattern for dropdown menus
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  /**
   * Handle sign out
   * Calls signOut from AuthContext, which clears session and redirects
   */
  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    await signOut();
  };

  /**
   * Get user initials for profile picture placeholder
   * Falls back to "U" if no email
   */
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-30 bg-[#c23032] dark:bg-[#1a1a1a] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <img src="/favicon.png" alt="SFU Course Planner" className="w-8 h-8" />
            <span className="text-lg font-semibold text-white">SFU Course Planner</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Public nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center space-x-1.5 py-1 text-white font-medium transition-all duration-200 group ${
                  isActive(link.href) ? "" : "hover:text-white/80"
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
                {/* Active underline */}
                <span
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-white transition-all duration-200 ${
                    isActive(link.href) ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                  }`}
                />
              </Link>
            ))}

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-1.5 text-white hover:text-white/80 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                )}
              </button>
            )}

            {/* AUTH SECTION: Sign In button OR Profile dropdown */}
            {!user ? (
              // LOGGED OUT: Show Sign In button
              <Link
                href="/login"
                className="px-4 py-1.5 bg-white text-red-600 rounded-md font-medium hover:bg-white/90 transition-colors"
              >
                Sign In
              </Link>
            ) : (
              // LOGGED IN: Show profile dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
                  aria-label="Profile menu"
                >
                  {/* Profile picture placeholder (using initials) */}
                  <div className="w-8 h-8 bg-white text-red-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {getUserInitials()}
                  </div>
                  {/* Dropdown arrow */}
                  <svg
                    className={`w-4 h-4 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-slate-700">
                    {/* User email */}
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                    </div>

                    {/* Dashboard link */}
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Dashboard
                    </Link>

                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-white/80 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 animate-fade-in border-t border-white/20 pt-3">
            <div className="flex flex-col space-y-1">
              {/* Public links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 text-white font-medium transition-all rounded flex items-center space-x-2 ${
                    isActive(link.href) ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              ))}

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="px-3 py-2 text-white font-medium text-left hover:bg-white/10 flex items-center justify-between rounded"
                >
                  <span className="flex items-center space-x-2">
                    {theme === "light" ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    )}
                    <span>Switch Theme</span>
                  </span>
                </button>
              )}

              {/* Mobile Auth Section */}
              <div className="pt-2 border-t border-white/20 mt-2">
                {!user ? (
                  // LOGGED OUT: Sign In link
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 bg-white text-red-600 rounded flex items-center justify-center font-medium"
                  >
                    Sign In
                  </Link>
                ) : (
                  // LOGGED IN: Dashboard + Sign Out
                  <>
                    <div className="px-3 py-2 text-white/80 text-sm">{user.email}</div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 text-white font-medium hover:bg-white/10 flex items-center space-x-2 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full px-3 py-2 text-red-400 font-medium hover:bg-white/10 flex items-center space-x-2 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Sign Out</span>
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
