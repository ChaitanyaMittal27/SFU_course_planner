"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bodyStyles, buttonStyles, displayStyles, labelStyles, numericStyles } from "@/app/fonts";
import { buttonVariants } from "@/components/ui/button";
import EmailPreview from "@/components/landing/EmailPreview";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TermInfo } from "@/lib/types";

// Faint dot grid behind the email. Set to false to remove it.
const SHOW_HERO_GRID = true;

// Headline numbers under the hero paragraph. Update as they grow.
export const HERO_STATS = [
  { value: "70+", label: "SFU students" },
  { value: "3300+", label: "courses" },
  { value: "100+", label: "emails every morning" },
];

function formatTerm({ term, year }: TermInfo) {
  return `${term.charAt(0).toUpperCase()}${term.slice(1)} ${year}`;
}

export default function Hero() {
  const { user } = useAuth();
  const [enrollingTerm, setEnrollingTerm] = useState<TermInfo | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getEnrollingTerm()
      .then((term) => {
        if (active) setEnrollingTerm(term ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const startHref = user ? "/dashboard" : "/login?tab=signup";

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto grid max-w-page grid-cols-1 items-center gap-10 px-4 pt-12 pb-16 sm:px-7 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:pt-20 lg:pb-20">
        <div className="animate-rise-in">
          {enrollingTerm && (
            <p className={cn(labelStyles.md, "mb-5 flex items-center gap-2 text-text-muted")}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
              {formatTerm(enrollingTerm)} enrollment is open
            </p>
          )}

          <h1 className={cn(displayStyles.landing, "mb-5 max-w-xl text-text-primary")}>
            Enrollment, minus the hassle.
          </h1>

          <p className={cn(bodyStyles.lg, "mb-6 max-w-lg text-text-muted")}>
            Bookmark the sections you want and get one email every morning with where each one stands: open, almost
            full or full. Grades, enrollment trends and professor ratings for every SFU course are one search away.
          </p>

          <dl
            aria-label="SFU Course Planner in numbers"
            className="mb-8 grid max-w-lg grid-cols-3 gap-x-3 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-10 border-t border-border pt-4.5"
          >
            {HERO_STATS.map((stat) => (
              // dt stays first in the markup; column-reverse puts the number on top visually.
              <div key={stat.label} className="flex min-w-0 flex-col-reverse justify-end gap-1.5">
                <dt className={cn(bodyStyles.sm, "text-text-muted")}>{stat.label}</dt>
                <dd className={cn(numericStyles.stat, "text-text-primary")}>{stat.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={startHref} className={cn(buttonVariants({ size: "xl" }), buttonStyles.xl, "w-full sm:w-auto")}>
              Start tracking courses
            </Link>
            <Link href="/browse" className={cn(buttonVariants({ variant: "outline", size: "xl" }), buttonStyles.xl, "w-full sm:w-auto")}
            >
              Browse courses
            </Link>
          </div>

          <p className={cn(bodyStyles.sm, "mt-4 text-text-subtle")}>
            Free · sign in with Google
          </p>
        </div>

        <div className="animate-rise-in relative min-w-0 [animation-delay:80ms]">
          {SHOW_HERO_GRID && <div aria-hidden="true" className="hero-dots pointer-events-none absolute -inset-x-12 -inset-y-16" />}
          <div className="relative"><EmailPreview /></div>
        </div>
      </div>
    </section>
  );
}
