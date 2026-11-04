import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  search: new URLSearchParams(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  initializePreferencesOnSignup: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.search,
}));
vi.mock("next/image", () => ({
  default: () => null,
}));
vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: {
    signInWithPassword: mocks.signInWithPassword,
    signUp: mocks.signUp,
    signInWithOAuth: mocks.signInWithOAuth,
    resetPasswordForEmail: mocks.resetPasswordForEmail,
  } },
}));
vi.mock("@/lib/api", () => ({ api: { initializePreferencesOnSignup: mocks.initializePreferencesOnSignup } }));

import LoginPage from "@/app/login/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.search = new URLSearchParams();
  mocks.signInWithPassword.mockResolvedValue({ error: null });
  mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
  mocks.signInWithOAuth.mockResolvedValue({ error: null });
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.initializePreferencesOnSignup.mockResolvedValue(undefined);
});

async function fillSignIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Email"), "student@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
}

describe("login page", () => {
  it("signs in with email and follows a safe requested destination", async () => {
    const user = userEvent.setup();
    mocks.search = new URLSearchParams("redirectTo=/browse/cmpt/225");
    render(<LoginPage />);

    await fillSignIn(user);
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "student@example.com", password: "password123" }));
    expect(mocks.replace).toHaveBeenCalledWith("/browse/cmpt/225");
  });

  it("rejects an external post-login destination", async () => {
    const user = userEvent.setup();
    mocks.search = new URLSearchParams("redirectTo=https://attacker.test");
    render(<LoginPage />);

    await fillSignIn(user);
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows Supabase sign-in errors without navigating", async () => {
    const user = userEvent.setup();
    mocks.signInWithPassword.mockResolvedValue({ error: new Error("Invalid login credentials") });
    render(<LoginPage />);

    await fillSignIn(user);
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid login credentials");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("shows a generic callback error without exposing provider details", async () => {
    mocks.search = new URLSearchParams("error=oauth_callback_failed");
    render(<LoginPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't complete sign in. Please try again.");
  });

  it("validates sign-up locally before contacting Supabase", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole("tab", { name: "Sign Up" }));
    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "different-password");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("uses the shared callback path for sign-up and OAuth providers", async () => {
    const user = userEvent.setup();
    mocks.search = new URLSearchParams("redirectTo=/dashboard?welcome=true");
    const view = render(<LoginPage />);

    await user.click(screen.getByRole("tab", { name: "Sign Up" }));
    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: "student@example.com",
      options: { emailRedirectTo: "http://localhost:3000/auth/callback?redirectTo=%2Fdashboard%3Fwelcome%3Dtrue" },
    })));

    await user.click(screen.getByRole("button", { name: "Sign in with Google" }));
    await waitFor(() => expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "http://localhost:3000/auth/callback?redirectTo=%2Fdashboard%3Fwelcome%3Dtrue" },
    }));

    // Microsoft sign-in was removed; Google is the only OAuth provider.
    expect(screen.queryByRole("button", { name: "Sign in with Microsoft" })).not.toBeInTheDocument();
    view.unmount();
  });

  it("sends password reset requests to the existing reset route", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: "Forgot password?" }));
    await user.type(screen.getByLabelText("Email", { selector: "#forgot-password-email" }), "student@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith("student@example.com", {
      redirectTo: "http://localhost:3000/auth/reset-password",
    }));
    expect(screen.getByRole("status")).toHaveTextContent("Email Sent!");
  });
});
