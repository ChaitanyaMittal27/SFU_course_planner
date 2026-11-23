"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <>
      {!isAdminRoute && <Navigation />}
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:outline-none"
      >
        Skip to main content
      </a>
      <main id="main-content" className="min-h-screen" tabIndex={-1}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </>
  );
}
