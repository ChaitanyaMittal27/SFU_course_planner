"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, BookOpen, TrendingUp, ClipboardList, Eye } from "lucide-react";
import Splash from "@/components/Splash";
import { Card } from "@/components/ui/card";
import { displayStyles, bodyStyles, headerStyles, labelStyles } from "@/app/fonts";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const features = [
  {
    href: "/browse",
    icon: BookOpen,
    title: "Browse Courses",
    description: "Explore 500+ courses across 50+ departments at three campuses",
  },
  {
    href: "/graph",
    icon: TrendingUp,
    title: "Analyze Trends",
    description: "Visualize enrollment trends and grade distributions",
  },
  {
    href: "/compare",
    icon: ClipboardList,
    title: "Compare Courses",
    description: "Compare courses side-by-side or different sections",
  },
  {
    href: "/dashboard",
    icon: Eye,
    title: "Track Watchers",
    description: "Monitor course sections and get notified of changes",
  },
];

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  // All hooks before early return — Rules of Hooks
  const heroRef = useScrollReveal({ threshold: 0.1 });
  const feat0Ref = useScrollReveal({ delay: 0 });
  const feat1Ref = useScrollReveal({ delay: 100 });
  const feat2Ref = useScrollReveal({ delay: 200 });
  const feat3Ref = useScrollReveal({ delay: 300 });
  const featureRefs = [feat0Ref, feat1Ref, feat2Ref, feat3Ref];

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border-strong) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.5,
        }}
      />

      {/* Content sits above all background layers */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">

          {/* Hero */}
          <div ref={heroRef} className="mb-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-12 h-12 text-primary-foreground" />
            </div>

            <h1 className={`${displayStyles.hero} text-text-primary mb-6`}>SFU Course Planner</h1>

            <p className={`${bodyStyles.lg} text-text-muted mb-8 max-w-2xl mx-auto`}>
              Plan your academic journey with ease. Browse courses, track enrollment, analyze trends, and make informed
              decisions about your classes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className={`${labelStyles.lg} inline-block bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-primary-foreground px-8 py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5`}
              >
                Get Started
              </Link>
              <Link
                href="/about"
                className={`${labelStyles.lg} inline-block bg-surface text-text-primary border-2 border-border hover:border-accent px-8 py-3 rounded-lg transition-all duration-300 hover:-translate-y-0.5`}
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {features.map(({ href, icon: Icon, title, description }, i) => (
              <div ref={featureRefs[i]} key={href}>
                <Link href={href} className="group">
                  <Card className="p-6 h-full transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className={`${headerStyles.md} text-text-primary mb-2`}>{title}</h3>
                    <p className={`${bodyStyles.md} text-text-muted`}>{description}</p>
                  </Card>
                </Link>
              </div>
            ))}
          </div>

          {/* Legal Links */}
          <div className="mt-16 pt-8 border-t border-border">
            <div className="flex items-center justify-center gap-6">
              <Link href="/privacy" className={`${bodyStyles.md} text-text-muted hover:text-accent transition-colors`}>
                Privacy Policy
              </Link>
              <span className="text-border-strong">•</span>
              <Link href="/terms" className={`${bodyStyles.md} text-text-muted hover:text-accent transition-colors`}>
                Terms of Service
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
