/**
 * =============================================================================
 * AUTH CONTEXT PROVIDER
 * =============================================================================
 *
 * Purpose:
 * Provides authentication state to the entire application via React Context.
 * Any component can access current user, loading state, and sign out function.
 *
 * Architecture:
 * - Wraps entire app in layout.tsx
 * - Fetches user once on mount
 * - Listens for auth changes (sign in, sign out, token refresh)
 * - Shares state via useAuth() hook
 *
 * State Management:
 * - user: Current authenticated user (or null if logged out)
 * - isLoading: True during initial auth check
 * - signOut: Function to sign out current user
 *
 * Usage in components:
 * ```typescript
 * const { user, userId, isLoading, signOut } = useAuth();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!user) return <RedirectToLogin />;
 * return <Dashboard userId={userId} />;
 * ```
 *
 * Connection Flow:
 * layout.tsx → AuthProvider → Entire app has access via useAuth()
 * =============================================================================
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@/lib/supabase/client";

/**
 * Auth context value type
 *
 * What components receive from useAuth():
 * - user: Full user object from Supabase (null if logged out)
 * - userId: User's UUID as string (null if logged out)
 * - isLoading: True while checking authentication status
 * - signOut: Async function to sign out current user
 */
interface AuthContextType {
  user: User | null;
  userId: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// Create context with undefined default (will be provided by AuthProvider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 *
 * Responsibilities:
 * 1. Fetch current user on mount
 * 2. Listen for auth state changes (sign in/out)
 * 3. Provide auth state to all child components
 * 4. Handle sign out functionality
 *
 * Lifecycle:
 * - Mount: Check if user is logged in
 * - Subscribe: Listen for auth events
 * - Update: When user signs in/out, update state
 * - Unmount: Cleanup subscription
 *
 * @param children - App components to wrap
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error loading user session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign out current user
   *
   * Flow:
   * 1. Call Supabase sign out
   * 2. Clear local user state
   * 3. Redirect to home page
   *
   * Error handling:
   * - Logs error but doesn't throw (fail gracefully)
   * - Still clears local state even if API call fails
   * - Always redirects to home page
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      // Redirect to home page after sign out
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      // Even if sign out fails, clear state and redirect
      setUser(null);
      window.location.href = "/";
    }
  };

  // Context value provided to all components
  const value = {
    user,
    userId: user?.id ?? null,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 *
 * Custom hook to access auth context in any component.
 * Must be used inside AuthProvider (throws error otherwise).
 *
 * @returns Auth context value (user, userId, isLoading, signOut)
 * @throws Error if used outside AuthProvider
 *
 * Example:
 * ```typescript
 * function Dashboard() {
 *   const { userId, isLoading } = useAuth();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return <WatchersTable userId={userId} />;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// testing jwt
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const fetchToken = async () => {
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token ?? null);
    };
    fetchToken();
  }, []);
  return token;
}
