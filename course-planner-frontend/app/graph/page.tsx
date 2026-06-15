"use client";

import Link from "next/link";
import { Suspense } from "react";
import { TrendingUp, Users, BarChart2, ArrowRight, Check, Info } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card } from "@/components/ui/card";
import { displayStyles, headerStyles, bodyStyles } from "@/app/fonts";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const chartTypes = [
  {
    href: "/graph/load",
    icon: TrendingUp,
    title: "Load Over Time",
    description: "Track course enrollment percentage across semesters",
    features: [
      "View 5-year enrollment trends",
      "Color-coded load indicators",
      "Interactive hover tooltips",
      "Click points to view offerings",
    ],
  },
  {
    href: "/graph/enrollment",
    icon: Users,
    title: "Enrollment vs Capacity",
    description: "Compare enrolled students to total capacity over time",
    features: [
      "Dual-line time series chart",
      "Track enrollment trends",
      "Monitor capacity changes",
      "Identify high-demand periods",
    ],
  },
  {
    href: "/graph/grades",
    icon: BarChart2,
    title: "Grade Distribution",
    description: "Analyze historical grade breakdowns for courses",
    features: ["Letter grade percentages", "Median grade display", "Fail rate statistics", "Data from CourseDiggers"],
  },
];

function GraphLandingPageContent() {
  const chart0Ref = useScrollReveal({ delay: 0 });
  const chart1Ref = useScrollReveal({ delay: 100 });
  const chart2Ref = useScrollReveal({ delay: 200 });
  const chartRefs = [chart0Ref, chart1Ref, chart2Ref];

  return (
    <PageContainer>
      {/* HERO SECTION */}
      <div className="mb-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-2xl">
          <BarChart2 className="w-12 h-12 text-primary-foreground" />
        </div>

        <h1 className={`${displayStyles.hero} text-text-primary mb-6`}>Course Analytics</h1>

        <p className={`${headerStyles.lg} text-text-muted mb-4 max-w-3xl mx-auto`}>
          Visualize enrollment trends, analyze grade distributions, and make data-driven course planning decisions
        </p>

        <p className={`${bodyStyles.md} text-text-subtle max-w-2xl mx-auto`}>
          Choose a chart type below to explore historical data across 500+ courses and 50+ departments
        </p>
      </div>

      {/* CHART TYPE CARDS */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {chartTypes.map((chart, i) => {
          const Icon = chart.icon;
          return (
            <div ref={chartRefs[i]} key={chart.href}>
            <Link href={chart.href} className="group">
              <Card className="p-6 h-full hover:scale-105 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-text-subtle group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className={`${headerStyles.lg} text-text-primary mb-2 group-hover:text-accent transition-colors`}>
                  {chart.title}
                </h3>
                <p className={`${bodyStyles.md} text-text-muted mb-4`}>{chart.description}</p>

                <ul className="space-y-2">
                  {chart.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-start ${bodyStyles.md} text-text-subtle`}>
                      <Check className="w-4 h-4 text-success mr-2 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Link>
            </div>
          );
        })}
      </div>

      {/* INFO SECTION */}
      <div className="mt-12">
        <Card className="p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-accent shrink-0" />
            <div>
              <h4 className={`${headerStyles.sm} text-text-primary mb-2`}>About This Data</h4>
              <p className={`${bodyStyles.md} text-text-muted mb-2`}>
                Enrollment data is fetched live from SFU's CourseSys API, ensuring you always see the most current
                information. Grade distributions are sourced from CourseDiggers and represent historical averages.
              </p>
              <p className={`${bodyStyles.md} text-text-subtle`}>
                Note: Grade data is course-level (not semester-specific) and may not be available for all courses.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

export default function GraphLandingPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GraphLandingPageContent />
    </Suspense>
  );
}
