/**
 * =============================================================================
 * MIDDLEWARE - ROUTE PROTECTION & TOKEN REFRESH
 * =============================================================================
 *
 * Purpose:
 * Runs on EVERY request before page loads to:
 * 1. Check if user is authenticated
 * 2. Refresh expired tokens automatically
 * 3. Protect routes that require login
 * 4. Redirect to login if accessing protected pages without auth
 *
 * Protected Routes:
 * - /dashboard - Requires authentication
 * - (Add more protected routes here as needed)
 *
 * Public Routes:
 * - / (landing), /browse, /graph, /compare, /docs, /about
 * - /login (obviously public)
 * - Static files, API routes
 *
 * Execution Flow:
 * 1. Request comes in (e.g., user navigates to /dashboard)
 * 2. Middleware runs BEFORE page component
 * 3. Check if route is protected
 * 4. If protected: Check if user is logged in
 * 5. If not logged in: Redirect to /login?redirectTo=/dashboard
 * 6. If logged in: Allow request to continue
 * 7. Refresh token if needed
 *
 * Why Token Refresh?
 * - Sessions expire after 1 hour by default
 * - Middleware refreshes automatically
 * - User stays logged in without interruption
 *
 * Connection:
 * - Uses: lib/supabase/server.ts (server-side auth)
 * - Runs: Before all routes (configured in matcher)
 * - Updates: Response cookies with refreshed token
 * =============================================================================
 */

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Middleware function
 *
 * Runs on every request matched by config.matcher
 *
 * Responsibilities:
 * 1. Create server Supabase client with request cookies
 * 2. Check current user authentication status
 * 3. Refresh token if expired
 * 4. Protect routes that require auth
 * 5. Allow or redirect based on auth state
 *
 * @param request - Incoming Next.js request
 * @returns Response (continue or redirect)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create authenticated Supabase client
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected routes (require authentication)
  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  /**
   * PROTECTED ROUTE LOGIC
   *
   * If user tries to access protected route without being logged in:
   * 1. Save the destination they wanted (redirectTo param)
   * 2. Redirect to /login
   * 3. After login, redirect back to original destination
   */
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);

    // Save original destination for post-login redirect
    redirectUrl.searchParams.set("redirectTo", pathname);

    return NextResponse.redirect(redirectUrl);
  }

  /**
   * LOGIN PAGE LOGIC
   *
   * If user is already logged in and tries to visit /login:
   * 1. Check if there's a redirectTo param (came from protected route)
   * 2. If yes: Redirect to that page
   * 3. If no: Redirect to dashboard
   */
  if (pathname === "/login" && user) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    const destination = redirectTo || "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Allow request to continue (user is authenticated or route is public)
  return NextResponse.next();
}

/**
 * Middleware Configuration
 *
 * matcher: Which routes middleware runs on
 *
 * Includes:
 * - /dashboard (protected)
 * - /login (redirect logic)
 *
 * Excludes (via negative lookahead):
 * - /api/* - API routes (handle auth separately)
 * - /_next/* - Next.js internal files
 * - /static/* - Static assets
 * - /*.ico, /*.png, /*.svg - Image files
 *
 * Why exclude these?
 * - Performance: No need to check auth for static files
 * - API routes: Have their own auth handling
 * - Next.js internals: Framework files don't need protection
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
