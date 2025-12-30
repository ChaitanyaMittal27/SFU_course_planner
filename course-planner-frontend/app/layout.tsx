import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SFU Course Planner — Plan Properly. Regret Less.",
  description:
    "Minimize hassle and make informed course decisions with all your SFU planning tools in one place — clear comparisons, better choices, less second-guessing.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.add(theme);
                if (theme === 'dark') {
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} transition-colors duration-300`}>
        <AuthProvider>
          <NuqsAdapter>
            <Navigation />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </NuqsAdapter>
        </AuthProvider>
      </body>
    </html>
  );
}
