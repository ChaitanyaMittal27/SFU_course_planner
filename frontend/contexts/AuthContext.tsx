"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session, User } from "@/lib/supabase/client";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userId: string | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The sole React owner of browser-session state.
 *
 * Route enforcement remains in the proxy and API authorization remains in the
 * backend. Components use this context only to render the correct client UI.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const updateSession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setStatus(nextSession ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    let isMounted = true;
    let receivedAuthEvent = false;

    const updateIfMounted = (nextSession: Session | null) => {
      if (isMounted) updateSession(nextSession);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true;
      updateIfMounted(nextSession);
    });

    const initializeSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Unable to load the Supabase session:", error);
        updateIfMounted(null);
        return;
      }

      // Do not overwrite a newer sign-in, sign-out, or token-refresh event.
      if (!receivedAuthEvent) updateIfMounted(data.session);
    };

    void initializeSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [updateSession]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Unable to sign out from Supabase:", error);
    } finally {
      updateSession(null);
      // A full navigation clears authenticated client caches after signing out.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    }
  }, [updateSession]);

  const value = useMemo<AuthContextType>(() => {
    const user = session?.user ?? null;

    return {
      session,
      user,
      userId: user?.id ?? null,
      status,
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated",
      signOut,
    };
  }, [session, signOut, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
