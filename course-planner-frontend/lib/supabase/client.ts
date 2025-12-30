/**
 * =============================================================================
 * SUPABASE BROWSER CLIENT
 * =============================================================================
 *
 * Purpose:
 * Creates a Supabase client instance for use in CLIENT COMPONENTS (browser).
 * This handles all authentication operations like sign in, sign up, sign out.
 *
 * Usage:
 * - Import in any client component that needs auth
 * - Call auth methods: supabase.auth.signIn(), signUp(), signOut()
 * - Used by: AuthContext, Login page, protected components
 *
 * Session Storage:
 * - Uses cookies to store session (httpOnly for security)
 * - Sessions persist across page refreshes
 * - Automatically refreshes expired tokens
 *
 * Note:
 * - This is a SINGLETON (one instance shared by all components)
 * - DO NOT use in server components or middleware
 * - For server-side, use lib/supabase/server.ts instead
 * =============================================================================
 */

import { createBrowserClient } from "@supabase/ssr";

// Get Supabase config from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase browser client instance
 *
 * Configuration:
 * - Uses environment variables for URL and key
 * - Stores session in cookies (not localStorage)
 * - Automatically handles token refresh
 *
 * Available methods:
 * - supabase.auth.signUp() - Create new account
 * - supabase.auth.signInWithPassword() - Email/password login
 * - supabase.auth.signInWithOAuth() - OAuth providers (Google, etc.)
 * - supabase.auth.signOut() - Sign out current user
 * - supabase.auth.getSession() - Get current session
 * - supabase.auth.getUser() - Get current user
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Export types for convenience
export type { User, Session } from "@supabase/supabase-js";
