import type { Metadata } from "next";
import { geist, geistMono } from "@/app/fonts";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import AppShell from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "SFU Course Planner — Plan Properly. Regret Less.",
  description:
    "Minimize hassle and make informed course decisions with all your SFU planning tools in one place — clear comparisons, better choices, less second-guessing.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var root = document.documentElement;
                var theme = 'dark';
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'light' || stored === 'dark') {
                    theme = stored;
                  } else if (window.matchMedia) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                } catch (e) {}
                root.classList.add(theme);
                root.classList.remove(theme === 'dark' ? 'light' : 'dark');
              })();
            `,
          }}
        />
      </head>
      <body className="transition-colors duration-300" suppressHydrationWarning>
        <AuthProvider>
          <NuqsAdapter>
            <AppShell>{children}</AppShell>
          </NuqsAdapter>
        </AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
