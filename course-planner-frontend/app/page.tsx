"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, TrendingUp, ClipboardList, Bell, ArrowRight } from "lucide-react";
import Splash from "@/components/Splash";
import HeroPreview from "@/components/landing/HeroPreview";
import { displayStyles, bodyStyles, labelStyles, headerStyles } from "@/app/fonts";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { api } from "@/lib/api";
import type { TermInfo } from "@/lib/types";

const SPLASH_KEY = "sfu-splash-shown";

// ── Feature rows data ─────────────────────────────────
// TODO: replace hardcoded demo data with API data from /api/courses
const features = [
  {
    icon: Search,
    title: "Browse Courses",
    description:
      "Filter 500+ courses across 50+ departments and three campuses — and find exactly what you need in seconds.",
    color: "primary" as const,
    layout: "text-left" as const,
    link: "/browse",
    preview: (
      <div className="flex flex-wrap gap-[9px]">
        {["CMPT 213", "CMPT 225", "MATH 232", "MACM 201", "STAT 270", "BUS 272", "PHYS 121"].map((code, i) => (
          <span
            key={code}
            className={`text-[13px] font-medium px-3.5 py-[9px] rounded-[9px] ${
              i === 0 ? "font-semibold bg-primary text-primary-foreground" : "bg-surface-raised text-text-primary"
            }`}
          >
            {code}
          </span>
        ))}
        <span className="text-[13px] font-medium px-3.5 py-[9px] rounded-[9px] bg-surface-raised text-text-muted">
          +511 more
        </span>
      </div>
    ),
  },
  {
    icon: TrendingUp,
    title: "Analyze Trends",
    description: "See grade distributions and term-by-term enrollment history before you commit to a section.",
    color: "accent" as const,
    layout: "text-right" as const,
    link: "/graph",
    preview: (
      <div>
        <div className="flex items-end gap-2 h-24 pt-1">
          {[38, 62, 88, 100, 70, 46, 28, 18].map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-t ${i === 3 ? "bg-primary" : "bg-accent"}`}
              style={{ height: `${h}%`, opacity: i === 3 ? 1 : 0.35 + (h / 100) * 0.65 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-[9px]">
          {["A+", "A", "B+", "B", "C+", "C", "D", "F"].map((g) => (
            <span key={g} className={`${labelStyles.sm} text-text-subtle`}>
              {g}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: ClipboardList,
    title: "Compare",
    description: "Put sections head-to-head on median grade, fail rate, and historical load.",
    color: "accent" as const,
    layout: "text-left" as const,
    link: "/compare",
    preview: (
      <div className="grid grid-cols-2 gap-3.5">
        {[
          { code: "CMPT 213", median: "B+", fail: "3.1%", failColor: "text-success", load: "82%" },
          { code: "CMPT 225", median: "B", fail: "9.4%", failColor: "text-warning", load: "97%" },
        ].map((c) => (
          <div key={c.code} className="border border-border rounded-[11px] p-4">
            <div className={`${headerStyles.xs} text-text-primary mb-2.5`}>{c.code}</div>
            {[
              { label: "Median", value: c.median, cls: "text-text-primary" },
              { label: "Fail rate", value: c.fail, cls: c.failColor },
              { label: "Avg load", value: c.load, cls: "text-text-primary" },
            ].map((row) => (
              <div
                key={row.label}
                className={`flex justify-between ${bodyStyles.sm} text-text-muted ${
                  row.label !== "Avg load" ? "mb-[5px]" : ""
                }`}
              >
                {row.label}
                <span className={`font-semibold ${row.cls}`}>{row.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Bell,
    title: "Track Watchers",
    description: "Watch any section and get an email the moment a seat opens or the waitlist moves.",
    color: "primary" as const,
    layout: "text-right" as const,
    link: "/dashboard",
    preview: (
      <div className="flex flex-col gap-2.5">
        {[
          { label: "MATH 232 · D100", badge: "2 SEATS OPEN", cls: "bg-success/[0.15] text-success" },
          { label: "CMPT 225 · D200", badge: "FULL · WAITLIST 4", cls: "bg-primary/[0.15] text-primary" },
          { label: "BUS 272 · D300", badge: "3 ON WAITLIST", cls: "bg-warning/[0.15] text-warning" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between px-4 py-[13px] border border-border rounded-[11px]"
          >
            <span className={`${headerStyles.xs} text-text-primary`}>{item.label}</span>
            <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${item.cls}`}>{item.badge}</span>
          </div>
        ))}
      </div>
    ),
  },
];

// ── Page ──────────────────────────────────────────────
export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(false);
  const [splashChecked, setSplashChecked] = useState(false);
  const [enrollingTerm, setEnrollingTerm] = useState<TermInfo | null>(null);

  const formatTerm = (term: string, year: number) => `${term.charAt(0).toUpperCase() + term.slice(1)} ${year}`;

  useEffect(() => {
    api
      .getEnrollingTerm()
      .then(setEnrollingTerm)
      .catch(() => null);
  }, []);

  useEffect(() => {
    const shown = sessionStorage.getItem(SPLASH_KEY);
    if (!shown) {
      setShowSplash(true);
    }
    setSplashChecked(true);
  }, []);

  const heroRef = useScrollReveal({ threshold: 0.1 });
  const feat0Ref = useScrollReveal({ delay: 0 });
  const feat1Ref = useScrollReveal({ delay: 100 });
  const feat2Ref = useScrollReveal({ delay: 200 });
  const feat3Ref = useScrollReveal({ delay: 300 });
  const featureRefs = [feat0Ref, feat1Ref, feat2Ref, feat3Ref];

  if (!splashChecked) return null;

  if (showSplash) {
    return (
      <Splash
        onComplete={() => {
          sessionStorage.setItem(SPLASH_KEY, "1");
          setShowSplash(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen animate-fade-in">
      {/* ── Hero ──────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Dot grid with radial mask */}
        <div className="absolute inset-0 pointer-events-none dot-grid-hero" />

        <div
          ref={heroRef}
          className="relative max-w-[1180px] mx-auto px-4 sm:px-7 pt-12 sm:pt-[72px] pb-10 grid grid-cols-1 lg:grid-cols-[1fr_1.02fr] gap-10 lg:gap-14 items-center"
        >
          {/* Left copy */}
          <div className="animate-slide-up">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface mb-5">
              <span className="w-[7px] h-[7px] rounded-full bg-success shadow-[0_0_0_3px_var(--success)]/20" />
              <span className={`${labelStyles.md} text-text-muted`}>
                {enrollingTerm
                  ? `${formatTerm(enrollingTerm.term, enrollingTerm.year)} enrollment is live`
                  : "Enrollment data live"}
              </span>
            </div>

            <h1 className={`${displayStyles.landing} text-text-primary mb-5`}>
              Plan your degree
              <br />
              with <span className="text-primary">confidence</span>.
            </h1>

            <p className={`${bodyStyles.lg} text-text-muted mb-8 max-w-[440px]`}>
              Browse every SFU course, watch sections fill in real time, and compare offerings side-by-side — all in one
              fast, focused workspace.
            </p>

            {/* CTAs */}
            <div className="flex gap-3 mb-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-primary-foreground bg-primary hover:bg-primary-hover px-[22px] py-[13px] rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-colors"
              >
                Get started
                <ArrowRight className="w-[17px] h-[17px]" />
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-text-primary bg-surface border border-border-strong hover:border-accent px-5 py-[13px] rounded-[10px] transition-colors"
              >
                Browse courses
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 sm:gap-[22px]">
              {[
                { value: "500+", label: "Courses" },
                { value: "50+", label: "Departments" },
                { value: "3", label: "Campuses" },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-5 sm:gap-[22px]">
                  {i > 0 && <div className="w-px h-[30px] bg-border" />}
                  <div>
                    <div className="font-display font-semibold text-[21px] text-text-primary">{stat.value}</div>
                    <div className={`${labelStyles.md} text-text-subtle`}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right preview */}
          <div className="animate-slide-up [animation-delay:80ms] hidden lg:block">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ── Feature rows ─────────────────────── */}
      <section className="max-w-[1180px] mx-auto px-4 sm:px-7 pt-6 pb-[90px] flex flex-col gap-5">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          const isTextLeft = feat.layout === "text-left";
          const iconBg = feat.color === "primary" ? "bg-primary/[0.14]" : "bg-accent/[0.14]";
          const iconColor = feat.color === "primary" ? "text-primary" : "text-accent";

          return (
            <div
              key={feat.title}
              ref={featureRefs[i]}
              className={`rounded-2xl bg-surface border border-border hover:border-border-strong transition-colors p-6 sm:p-[34px_36px] grid grid-cols-1 ${
                isTextLeft ? "lg:grid-cols-[0.82fr_1.18fr]" : "lg:grid-cols-[1.18fr_0.82fr]"
              } gap-8 lg:gap-11 items-center`}
            >
              {/* Text block */}
              <a href={feat.link}>
                <div className={isTextLeft ? "lg:order-1" : "lg:order-2"}>
                  <div className="flex items-center gap-3 mb-3.5">
                    <div
                      className={`w-[42px] h-[42px] rounded-[11px] ${iconBg} flex items-center justify-center ${iconColor} shrink-0`}
                    >
                      <Icon className="w-[21px] h-[21px]" />
                    </div>
                    <h3 className={`${headerStyles.lg} font-display text-text-primary tracking-tight`}>{feat.title}</h3>
                  </div>
                  <p className={`${bodyStyles.md} text-text-muted max-w-[340px] leading-relaxed`}>{feat.description}</p>
                </div>
              </a>

              {/* Preview block */}
              <div className={isTextLeft ? "lg:order-2" : "lg:order-1"}>{feat.preview}</div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
