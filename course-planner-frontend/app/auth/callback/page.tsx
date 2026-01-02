/**
 * =============================================================================
 * AUTH CALLBACK PAGE - OAUTH REDIRECT HANDLER
 * =============================================================================
 *
 * Purpose:
 * Handles OAuth callback after user signs in with Google.
 * This is where Google redirects users after they authorize your app.
 *
 * Flow:
 * 1. User clicks "Sign in with Google" on /login
 * 2. Supabase redirects to Google OAuth
 * 3. User authorizes app on Google
 * 4. Google redirects back to: /auth/callback?code=...&redirectTo=/dashboard
 * 5. This page exchanges OAuth code for Supabase session
 * 6. Creates session cookie
 * 7. Redirects to original destination (dashboard or redirectTo param)
 *
 * Why This Exists:
 * - OAuth providers (Google, GitHub, etc.) need a callback URL
 * - This URL must be whitelisted in Supabase dashboard
 * - This page handles the OAuth code exchange
 * - Without this, Google OAuth won't work
 *
 * Configuration Required:
 * 1. Supabase Dashboard → Authentication → URL Configuration
 * 2. Add to "Redirect URLs":
 *    - http://localhost:3000/auth/callback (for dev)
 *    - https://sfucourseplanner.com/auth/callback (for production)
 *
 * Connection:
 * - Called by: Google OAuth after user authorizes
 * - Uses: Supabase client to exchange code for session
 * - Redirects to: /dashboard or ?redirectTo param
 * =============================================================================
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * OAUTH CODE EXCHANGE
     *
     * Flow:
     * 1. Check URL for OAuth code (from Google)
     * 2. If code exists, exchange it for Supabase session
     * 3. Supabase creates session token
     * 4. Session stored in cookie
     * 5. Redirect to destination
     *
     * URL Format:
     * /auth/callback?code=abc123&redirectTo=/dashboard
     *
     * Note:
     * - Code is one-time use (expires quickly)
     * - Supabase handles the exchange automatically
     * - We just need to wait for session to be created
     */
    const handleCallback = async () => {
      try {
        // Get OAuth code from URL
        const code = searchParams.get("code");

        if (!code) {
          // No code - user navigated here directly (not from OAuth)
          // Silently redirect to home without showing error
          router.push("/");
          return;
        }

        // Exchange code for session (Supabase handles this automatically)
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("OAuth exchange error:", exchangeError);
          setError(exchangeError.message || "Failed to complete sign in");

          // After showing error, redirect back to login
          setTimeout(() => {
            router.push("/login");
          }, 3000);
          return;
        }

        // Get redirect destination
        const redirectTo = searchParams.get("redirectTo") || "/dashboard";

        // Success - redirect to destination
        router.push(redirectTo);
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setError(err.message || "Failed to complete sign in");

        // After showing error, redirect back to login
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  // Show loading while processing OAuth callback
  if (!error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    );
  }

  // Show error if OAuth failed
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="light-card dark:dark-card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In Failed</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting back to login...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthCallbackPageContent />
    </Suspense>
  );
}
