/**
 * =============================================================================
 * SUPABASE SERVER CLIENT
 * =============================================================================
 *
 * Purpose:
 * Creates a Supabase client for SERVER-SIDE usage (middleware, server components).
 * Unlike the browser client, this reads cookies from the request context.
 *
 * Usage:
 * - Import in middleware.ts
 * - Import in Server Components (app router)
 * - Import in Server Actions
 * - Call createClient() to get authenticated instance
 *
 * Why Factory Function?
 * - Each request needs its own client instance
 * - Cannot share one instance (unlike browser client)
 * - Each client reads cookies from its specific request
 *
 * Cookie Handling:
 * - Reads session cookies from incoming request
 * - Writes updated cookies to response (token refresh)
 * - Automatically syncs with browser client
 *
 * Note:
 * - DO NOT use in client components
 * - For client-side, use lib/supabase/client.ts instead
 * =============================================================================
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for server-side operations
 *
 * How it works:
 * 1. Reads Supabase session from request cookies
 * 2. Creates authenticated client if session exists
 * 3. Handles token refresh automatically
 * 4. Writes updated cookies back to response
 *
 * @returns Authenticated Supabase client instance
 *
 * Example usage in middleware:
 * ```typescript
 * const supabase = createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * if (!user) {
 *   return NextResponse.redirect('/login');
 * }
 * ```
 *
 * Example usage in Server Component:
 * ```typescript
 * const supabase = createClient();
 * const { data: { session } } = await supabase.auth.getSession();
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      // Read cookie from request
      getAll() {
        return cookieStore.getAll();
      },
      // Write cookie to response
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Cookie setting can fail in Server Components
          // This is okay - cookies will be set in middleware instead
        }
      },
    },
  });
}
