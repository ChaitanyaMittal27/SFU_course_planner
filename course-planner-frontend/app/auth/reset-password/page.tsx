/**
 * =============================================================================
 * PASSWORD RESET PAGE
 * =============================================================================
 *
 * Purpose:
 * Allows users to set a new password after clicking reset link from email.
 *
 * Flow:
 * 1. User requests password reset from /login
 * 2. Receives email with reset link
 * 3. Clicks link → Lands here
 * 4. Enters new password
 * 5. Updates password via Supabase
 * 6. Redirects to login
 *
 * Security:
 * - Supabase validates reset token from email link
 * - Token expires after certain time
 * - Password must meet minimum requirements
 *
 * Connection:
 * - Called from: Email reset link
 * - Uses: Supabase updateUser
 * - Redirects to: /login after success
 * =============================================================================
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";

function ResetPasswordPageContent() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  /**
   * Validate reset token on mount
   *
   * The reset link includes a token that Supabase validates.
   * If token is invalid or expired, show error.
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError("Invalid or expired reset link. Please request a new password reset.");
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (err) {
        setError("Failed to validate reset link.");
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    checkSession();
  }, []);

  /**
   * Handle password reset submission
   *
   * Flow:
   * 1. Validate passwords match
   * 2. Update password via Supabase
   * 3. Show success message
   * 4. Redirect to login
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while validating token
  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
        <p className="ml-3 text-gray-600 dark:text-gray-400">Validating reset link...</p>
      </div>
    );
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="light-card dark:dark-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "This password reset link is invalid or has expired."}
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="light-card dark:dark-card p-8 max-w-md w-full text-center">
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Password Reset Successful!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your password has been updated. Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  // Show reset form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="light-card dark:dark-card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Your Password</h1>
          <p className="text-gray-600 dark:text-gray-400">Enter your new password below</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              minLength={6}
              placeholder="Re-enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
