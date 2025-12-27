"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense } from "react";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

function GraphLandingPageContent() {
  const chartTypes = [
    {
      href: "/graph/load",
      icon: "📈",
      title: "Load Over Time",
      description: "Track course enrollment percentage across semesters",
      features: [
        "View 5-year enrollment trends",
        "Color-coded load indicators (🟢🟡🔴)",
        "Interactive hover tooltips",
        "Click points to view offerings",
      ],
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      href: "/graph/enrollment",
      icon: "👥",
      title: "Enrollment vs Capacity",
      description: "Compare enrolled students to total capacity over time",
      features: [
        "Dual-line time series chart",
        "Track enrollment trends",
        "Monitor capacity changes",
        "Identify high-demand periods",
      ],
      gradient: "from-purple-500 to-pink-500",
    },
    {
      href: "/graph/grades",
      icon: "📊",
      title: "Grade Distribution",
      description: "Analyze historical grade breakdowns for courses",
      features: ["Letter grade percentages", "Median grade display", "Fail rate statistics", "Data from CourseDiggers"],
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <PageContainer>
      {/* HERO SECTION */}
      <div className="mb-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl">
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">Course Analytics</h1>

        <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
          Visualize enrollment trends, analyze grade distributions, and make data-driven course planning decisions
        </p>

        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Choose a chart type below to explore historical data across 500+ courses and 50+ departments
        </p>
      </div>

      {/* CHART TYPE CARDS */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {chartTypes.map((chart) => (
          <Link
            key={chart.href}
            href={chart.href}
            className="group light-card dark:dark-card p-6 hover:scale-105 transition-all duration-300"
          >
            {/* Icon + Badge */}
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-14 h-14 bg-gradient-to-br ${chart.gradient} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <span className="text-3xl">{chart.icon}</span>
              </div>
              <svg
                className="w-6 h-6 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            {/* Title + Description */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              {chart.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{chart.description}</p>

            {/* Features List */}
            <ul className="space-y-2">
              {chart.features.map((feature, idx) => (
                <li key={idx} className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>

      {/* INFO SECTION */}
      <div className="mt-12 light-card dark:dark-card p-6">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">About This Data</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Enrollment data is fetched live from SFU's CourseSys API, ensuring you always see the most current
              information. Grade distributions are sourced from CourseDiggers and represent historical averages.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Note: Grade data is course-level (not semester-specific) and may not be available for all courses.
            </p>
          </div>
        </div>
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
