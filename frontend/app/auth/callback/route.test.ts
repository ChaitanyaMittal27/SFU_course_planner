import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));
vi.mock("@/lib/supabase/config", () => ({
  supabasePublicUrl: "https://project.supabase.co",
  supabaseAnonKey: "anon-key",
  supabaseAuthCookieName: "sb-project-auth-token",
}));

import { GET } from "@/app/auth/callback/route";

function callbackRequest(query = "") {
  return new NextRequest(`http://localhost:3000/auth/callback${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.fetch.mockResolvedValue({ ok: true });
  mocks.createServerClient.mockReturnValue({
    auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
  });
  mocks.exchangeCodeForSession.mockResolvedValue({
    data: {
      session: {
        access_token: "access-token",
        user: { email: "student@example.com" },
      },
    },
    error: null,
  });
});

describe("auth callback route", () => {
  it("exchanges a code server-side, preserves session cookies, initializes preferences, and redirects safely", async () => {
    mocks.exchangeCodeForSession.mockImplementation(async () => {
      const options = mocks.createServerClient.mock.calls[0][2];
      options.cookies.setAll([{ name: "sb-project-auth-token", value: "session", options: { path: "/" } }]);
      return {
        data: { session: { access_token: "access-token", user: { email: "student@example.com" } } },
        error: null,
      };
    });

    const response = await GET(callbackRequest("?code=one-time-code&redirectTo=/browse/cmpt/225"));

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("one-time-code");
    expect(mocks.fetch).toHaveBeenCalledWith("https://api.example.test/api/preferences", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer access-token" }),
    }));
    expect(response.headers.get("location")).toBe("http://localhost:3000/browse/cmpt/225");
    expect(response.cookies.get("sb-project-auth-token")?.value).toBe("session");
  });

  it("falls back to the dashboard when a callback requests an external destination", async () => {
    const response = await GET(callbackRequest("?code=one-time-code&redirectTo=https://attacker.example"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("returns to login with a clear error when the code is missing", async () => {
    const response = await GET(callbackRequest("?redirectTo=/dashboard"));

    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?redirectTo=%2Fdashboard&error=oauth_callback_failed");
  });

  it("returns to login without exposing provider errors when the exchange fails", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ data: { session: null }, error: new Error("provider detail") });

    const response = await GET(callbackRequest("?code=invalid-code&redirectTo=/browse"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?redirectTo=%2Fbrowse&error=oauth_callback_failed");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("does not block a successful sign-in when preference initialization fails", async () => {
    mocks.fetch.mockRejectedValue(new Error("backend unavailable"));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = await GET(callbackRequest("?code=one-time-code"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
    expect(warning).toHaveBeenCalledWith("Failed to initialize preferences after authentication");
    warning.mockRestore();
  });
});
