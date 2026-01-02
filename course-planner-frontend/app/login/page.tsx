/*
 * =============================================================================
 * LOGIN PAGE - AUTHENTICATION ENTRY POINT
 * =============================================================================
 *
 * Purpose:
 * Unified authentication page supporting:
 * - Email/Password sign in
 * - Email/Password sign up
 * - Google OAuth
 * - Forgot Password flow
 *
 * Features:
 * - Tabbed interface (Sign In / Sign Up)
 * - Form validation
 * - Error handling
 * - Loading states
 * - Auto-redirect if already logged in
 * - Forgot password modal
 *
 * Flow:
 * 1. User visits /login
 * 2. Chooses sign in or sign up tab
 * 3. Submits credentials OR clicks Google OAuth
 * 4. On success: Redirect to /dashboard (or ?redirectTo param)
 * 5. On error: Show error message
 *
 * Connection:
 * - Uses: Supabase Auth
 * - Redirects to: /dashboard or ?redirectTo
 * - OAuth callback: /auth/callback
 * =============================================================================
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  /**
   * AUTO-REDIRECT: If user is already logged in, redirect to dashboard
   *
   * This prevents logged-in users from seeing the login page.
   * Common UX pattern for authenticated apps.
   */
  useEffect(() => {
    if (!authLoading && user) {
      const redirectTo = searchParams.get("redirectTo") || "/dashboard";
      router.push(redirectTo);
    }
  }, [user, authLoading, router, searchParams]);

  /**
   * HANDLE EMAIL/PASSWORD SIGN IN
   *
   * Flow:
   * 1. Validate inputs
   * 2. Call Supabase signInWithPassword
   * 3. On success: Redirect to dashboard
   * 4. On error: Show error message
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Success - AuthContext will handle redirect
      const redirectTo = searchParams.get("redirectTo") || "/dashboard";
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * HANDLE EMAIL/PASSWORD SIGN UP
   *
   * Flow:
   * 1. Validate inputs (email, password match)
   * 2. Call Supabase signUp
   * 3. Send confirmation email
   * 4. Show success message
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setSuccessMessage("Account created! Please check your email to verify your account.");

      // Clear form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * HANDLE GOOGLE OAUTH
   *
   * Flow:
   * 1. Call Supabase signInWithOAuth
   * 2. Supabase redirects to Google
   * 3. User authorizes app
   * 4. Google redirects to /auth/callback
   * 5. Callback page handles session creation
   */
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const redirectTo = searchParams.get("redirectTo") || "/dashboard";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
        },
      });

      if (error) throw error;

      // Note: Supabase will redirect to Google, so we won't reach here
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  /**
   * HANDLE FORGOT PASSWORD
   *
   * Flow:
   * 1. User enters email
   * 2. Send password reset email via Supabase
   * 3. Show success message
   * 4. User clicks link in email
   * 5. Redirects to password reset page
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setForgotSuccess(true);

      // Auto-close modal after 3 seconds
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotSuccess(false);
        setForgotEmail("");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Don't show login page if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="light-card dark:dark-card p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to SFU Course Planner</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to manage your course bookmarks</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => {
              setActiveTab("signin");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "signin"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "signup"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
            {successMessage}
          </div>
        )}

        {/* Sign In Form */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4" title="signin">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                title="signing-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                title="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4" title="signup">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                title="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md flex items-center justify-center space-x-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span className="text-gray-700 dark:text-gray-300 font-medium">Sign in with Google</span>
        </button>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="light-card dark:dark-card p-6 max-w-md w-full">
            {!forgotSuccess ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reset Password</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4" title="forgotemail">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      title="emailforgot"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotEmail("");
                      }}
                      className="flex-1 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forgotLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Email Sent!</h3>
                <p className="text-gray-600 dark:text-gray-400">Check your email for the password reset link.</p>
              </div>
            )}
          </div>
        </div>
      )}
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
