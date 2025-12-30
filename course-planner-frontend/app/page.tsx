"use client";

import { useState } from "react";
import Link from "next/link";
import Splash from "@/components/Splash";

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">SFU Course Planner</h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Plan your academic journey with ease. Browse courses, track enrollment, analyze trends, and make informed
              decisions about your classes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-block bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Get Started
              </Link>
              <Link
                href="/about"
                className="inline-block bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-slate-600 hover:border-orange-500 dark:hover:border-orange-500 px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {/* Browse */}
            <Link href="/browse" className="group">
              <div className="light-card dark:dark-card p-6 h-full transition-transform duration-300 group-hover:-translate-y-1">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Browse Courses</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Explore 500+ courses across 50+ departments at three campuses
                </p>
              </div>
            </Link>

            {/* Graph */}
            <Link href="/graph" className="group">
              <div className="light-card dark:dark-card p-6 h-full transition-transform duration-300 group-hover:-translate-y-1">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analyze Trends</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Visualize enrollment trends and grade distributions
                </p>
              </div>
            </Link>

            {/* Compare */}
            <Link href="/compare" className="group">
              <div className="light-card dark:dark-card p-6 h-full transition-transform duration-300 group-hover:-translate-y-1">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Compare Courses</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Compare courses side-by-side or different sections
                </p>
              </div>
            </Link>

            {/* Watchers */}
            <Link href="/dashboard" className="group">
              <div className="light-card dark:dark-card p-6 h-full transition-transform duration-300 group-hover:-translate-y-1">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Track Watchers</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Monitor course sections and get notified of changes
                </p>
              </div>
            </Link>
          </div>
          <div className="w-full border-t border-gray-200 dark:border-slate-700 py-6 px-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            {/* Legal Links */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-slate-700 sm:mt-0 sm:pt-0 sm:border-0 w-full">
              <div className="flex items-center justify-center gap-6 text-sm">
                <Link
                  href="/privacy"
                  className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  Privacy Policy
                </Link>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <Link
                  href="/terms"
                  className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
