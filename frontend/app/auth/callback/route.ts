import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { buildLoginPath, resolveAuthRedirect } from "@/lib/auth/redirect";
import { supabaseAnonKey, supabaseAuthCookieName, supabasePublicUrl } from "@/lib/supabase/config";

type CookieToSet = {
  name: string;
  value: string;
  options: Parameters<NextResponse["cookies"]["set"]>[2];
};

function createCallbackClient(request: NextRequest, cookiesToSet: CookieToSet[]) {
  return createServerClient(supabasePublicUrl, supabaseAnonKey, {
    cookieOptions: { name: supabaseAuthCookieName },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => cookiesToSet.push({ name, value, options }));
      },
    },
  });
}

function applySessionCookies(response: NextResponse, cookiesToSet: CookieToSet[]) {
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

function failureResponse(request: NextRequest, destination: string, cookiesToSet: CookieToSet[]) {
  const loginUrl = new URL(buildLoginPath(destination), request.url);
  loginUrl.searchParams.set("error", "oauth_callback_failed");

  return applySessionCookies(NextResponse.redirect(loginUrl), cookiesToSet);
}

async function initializePreferences(accessToken: string, email: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return;

  try {
    const response = await fetch(`${apiUrl}/api/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userEmail: email, emailNotificationsEnabled: true }),
    });

    if (!response.ok) {
      console.warn("Failed to initialize preferences after authentication");
    }
  } catch {
    console.warn("Failed to initialize preferences after authentication");
  }
}

/**
 * Completes OAuth and email-confirmation PKCE exchanges on the server.
 * The Supabase SSR client reads the verifier from the request cookie and
 * attaches the resulting session cookies to the redirect response.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = resolveAuthRedirect(request.nextUrl.searchParams.get("redirectTo"));
  const cookiesToSet: CookieToSet[] = [];

  if (!code) {
    return failureResponse(request, destination, cookiesToSet);
  }

  const supabase = createCallbackClient(request, cookiesToSet);
  const {
    data: { session },
    error,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !session) {
    return failureResponse(request, destination, cookiesToSet);
  }

  if (session.user.email) {
    await initializePreferences(session.access_token, session.user.email);
  }

  return applySessionCookies(NextResponse.redirect(new URL(destination, request.url)), cookiesToSet);
}
