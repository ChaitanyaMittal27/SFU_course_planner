/**
 * =============================================================================
 * LOGIN PAGE - SIGN IN & SIGN UP
 * =============================================================================
 *
 * Purpose:
 * Unified authentication page with two modes:
 * 1. Sign In - Existing users log in with email/password or Google
 * 2. Sign Up - New users create account with email/password or Google
 *
 * Features:
 * - Tabbed interface (Sign In / Sign Up)
 * - Email + password authentication
 * - Google OAuth (one-click sign in)
 * - Form validation and error messages
 * - Loading states during auth operations
 * - Auto-redirect after successful auth
 * - Redirect back to original destination (if came from protected route)
 *
 * User Flow:
 * 1. User clicks "Sign In" in navbar → comes here
 * 2. OR user tries to access /dashboard → middleware redirects here with ?redirectTo=/dashboard
 * 3. User chooses Sign In or Sign Up tab
 * 4. Fills form OR clicks "Sign in with Google"
 * 5. After success → redirect to /dashboard (or redirectTo param destination)
 *
 * Connection:
 * - Uses: lib/supabase/client.ts for auth operations
 * - Uses: contexts/AuthContext.tsx for auth state (via useAuth hook)
 * - Middleware handles: Redirect if already logged in
 * - Redirects to: /dashboard by default, or ?redirectTo param value
 * =============================================================================
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

// Tab type for Sign In vs Sign Up mode
type AuthTab = "signin" | "signup";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Form state
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * REDIRECT LOGIC
   *
   * If user is already logged in, redirect immediately.
   * This prevents logged-in users from seeing login page.
   *
   * Flow:
   * 1. Check if user exists (from AuthContext)
   * 2. Get redirectTo param (if came from protected route)
   * 3. Redirect to destination
   */
  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get("redirectTo") || "/dashboard";
      router.push(redirectTo);
    }
  }, [user, router, searchParams]);

  /**
   * EMAIL/PASSWORD SIGN IN
   *
   * Flow:
   * 1. Call Supabase signInWithPassword
   * 2. If success: AuthContext detects change, updates user state
   * 3. useEffect above triggers redirect
   * 4. If error: Show error message
   *
   * Error Handling:
   * - Invalid credentials → "Invalid email or password"
   * - Network error → Show technical error
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Success - AuthContext will detect auth change and useEffect will redirect
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  /**
   * EMAIL/PASSWORD SIGN UP
   *
   * Flow:
   * 1. Validate passwords match
   * 2. Call Supabase signUp
   * 3. If email confirmation disabled: User logged in immediately
   * 4. If email confirmation enabled: Show "Check your email" message
   * 5. If success: Redirect to dashboard
   *
   * Note:
   * - Supabase creates user in auth.users table
   * - User gets UUID as user.id
   * - This UUID is what we'll use for watchers table
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // Success - Check if email confirmation is required
      if (data.user && !data.user.confirmed_at) {
        setError("Check your email to confirm your account");
        setLoading(false);
        return;
      }

      // If no email confirmation required, user is logged in automatically
      // AuthContext will detect change and redirect
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  /**
   * GOOGLE OAUTH SIGN IN
   *
   * Flow:
   * 1. Call Supabase signInWithOAuth
   * 2. User redirected to Google login page
   * 3. User authorizes app
   * 4. Google redirects back to your app
   * 5. Supabase exchanges OAuth code for session
   * 6. Middleware detects session, allows access
   * 7. User lands on /dashboard (or redirectTo destination)
   *
   * Configuration:
   * - Requires Google OAuth setup in Supabase dashboard
   * - Redirect URL must be whitelisted in Supabase
   * - Works for both sign in AND sign up (Google handles account creation)
   *
   * Error Handling:
   * - If OAuth fails, user returns to login page
   * - Error shown via URL params (handled by Supabase)
   */
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const redirectTo = searchParams.get("redirectTo") || "/dashboard";

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // After Google auth, redirect back to this URL
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (oauthError) throw oauthError;

      // User will be redirected to Google, then back to /auth/callback
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  /**
   * TAB SWITCHING
   *
   * Clears form and error when switching between Sign In/Sign Up
   */
  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setError(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">SFU Course Planner</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to manage your course watchers</p>
        </div>

        {/* Auth Card */}
        <div className="light-card dark:dark-card p-8 space-y-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => switchTab("signin")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === "signin"
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab("signup")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === "signup"
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Sign In Form */}
          {activeTab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="signin-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={6}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Must be at least 6 characters</p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginPageContent />
    </Suspense>
  );
}
