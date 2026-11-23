"use client";

import { Suspense } from "react";
import LoginCard from "@/components/auth/LoginCard";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";

// Enable once SFU's Azure (Microsoft) OAuth setup is done. The button uses the same
// signInWithOAuth("azure") path and callback as Google.
const SHOW_MICROSOFT_LOGIN = false;

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginCard showMicrosoft={SHOW_MICROSOFT_LOGIN} />
    </Suspense>
  );
}
