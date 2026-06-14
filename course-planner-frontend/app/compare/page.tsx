"use client";

import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import { Suspense } from "react";
import { BookOpen, ClipboardList, ArrowRight } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card } from "@/components/ui/card";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

const modes = [
  {
    href: "/compare/courses",
    icon: BookOpen,
    title: "Which Course Should I Take?",
    description:
      "Compare different courses side-by-side to see prerequisites, difficulty, grade distributions, and more.",
    exampleText: (
      <>
        Compare <span className="font-semibold text-accent">CMPT 276</span> vs{" "}
        <span className="font-semibold text-accent">CMPT 295</span> vs{" "}
        <span className="font-semibold text-accent">CMPT 213</span>
      </>
    ),
    cta: "Compare Courses",
  },
  {
    href: "/compare/sections",
    icon: ClipboardList,
    title: "Which Section Should I Choose?",
    description:
      "Compare sections of the same course to see instructors, campus locations, availability, and enrollment status.",
    exampleText: (
      <>
        Compare <span className="font-semibold text-accent">CMPT 276 D100</span> vs{" "}
        <span className="font-semibold text-accent">D200</span> vs{" "}
        <span className="font-semibold text-accent">D300</span>
      </>
    ),
    cta: "Compare Sections",
  },
];

function CompareLandingContent() {
  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`${displayStyles.hero} text-text-primary mb-4`}>Compare & Decide</h1>
          <p className={`${bodyStyles.lg} text-text-muted max-w-2xl mx-auto`}>
            Make informed decisions about your courses. Compare different courses to find the right fit, or compare
            sections to choose the best offering.
          </p>
        </div>

        {/* Two Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link href={mode.href} key={mode.href}>
                <Card className="p-8 cursor-pointer transition-all duration-300 hover:scale-105 h-full">
                  <div className="flex flex-col h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-6 mx-auto">
                      <Icon className="w-9 h-9 text-primary-foreground" />
                    </div>

                    <div className="text-center flex-grow">
                      <h2 className={`${headerStyles.lg} text-text-primary mb-3`}>{mode.title}</h2>
                      <p className={`${bodyStyles.md} text-text-muted mb-6`}>{mode.description}</p>

                      <div className="bg-accent/5 rounded-lg p-4 mb-6 border border-accent/20">
                        <p className={`${labelStyles.md} text-text-muted mb-2`}>Example:</p>
                        <p className={`${bodyStyles.md} text-text-muted`}>{mode.exampleText}</p>
                      </div>
                    </div>

                    <div className="text-center mt-auto">
                      <span className={`inline-flex items-center text-accent ${labelStyles.lg}`}>
                        {mode.cta}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center">
          <Card className="p-6 inline-block text-left max-w-xl">
            <h3 className={`${headerStyles.sm} text-text-primary mb-2`}>Not sure which to use?</h3>
            <p className={`${bodyStyles.md} text-text-muted`}>
              <span className="font-medium">Course comparison</span> helps you decide between different courses.{" "}
              <span className="font-medium">Section comparison</span> helps you choose the best section once you've
              picked a course.
            </p>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

export default function CompareLanding() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CompareLandingContent />
    </Suspense>
  );
}
