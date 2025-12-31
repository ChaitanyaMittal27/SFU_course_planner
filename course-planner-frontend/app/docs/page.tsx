"use client";

import LoadingSpinner from "@/components/LoadingSpinner";
import PageContainer from "@/components/PageContainer";
import { Suspense } from "react";

function ApiDocsPageContent() {
  const API_BASE = "https://api.sfucourseplanner.com";

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">API Documentation</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Public REST API for accessing SFU course data, enrollment statistics, and grade distributions.
          </p>
        </div>

        {/* Base URL */}
        <div className="light-card dark:dark-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Base URL</h2>
          <code className="bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded text-orange-600 dark:text-orange-400">
            {API_BASE}
          </code>
        </div>

        {/* About Endpoint */}
        <div className="light-card dark:dark-card p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">About</h2>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              GET <code className="text-orange-600 dark:text-orange-400">/api/about</code>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">Returns application metadata.</p>

            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Example Response:</p>
              <pre className="text-sm overflow-x-auto">
                {`{
  "appName": "CoursePlanner",
  "authorName": "Anonymouse"
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Browse Endpoints */}
        <div className="light-card dark:dark-card p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Browse</h2>

          {/* Get Departments */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              GET <code className="text-orange-600 dark:text-orange-400">/api/departments</code>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">Returns all departments at SFU.</p>

            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Example Response:</p>
              <pre className="text-sm overflow-x-auto">
                {`[
  {
    "deptId": 1,
    "deptCode": "CMPT",
    "name": "Computing Science"
  },
  {
    "deptId": 2,
    "deptCode": "MATH",
    "name": "Mathematics"
  }
]`}
              </pre>
            </div>
          </div>

          {/* Get Courses */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              GET <code className="text-orange-600 dark:text-orange-400">/api/departments/{"{deptId}"}/courses</code>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">Returns all courses in a department.</p>

            <table className="w-full mb-3 text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-2 text-gray-900 dark:text-white">Parameter</th>
                  <th className="text-left py-2 text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-2 text-gray-600 dark:text-gray-300">deptId</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Department ID (from /api/departments)</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Example Request:</p>
              <code className="text-sm text-orange-600 dark:text-orange-400">GET /api/departments/1/courses</code>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-2">Example Response:</p>
              <pre className="text-sm overflow-x-auto">
                {`[
  {
    "courseId": 42,
    "deptId": 1,
    "courseNumber": "120",
    "title": "Introduction to Computing Science and Programming I",
    "description": "An elementary introduction to computing...",
    "units": 3,
    "degreeLevel": "UGRD",
    "prerequisites": "BC Math 12 or equivalent",
    "corequisites": null,
    "designation": "Q"
  }
]`}
              </pre>
            </div>
          </div>

          {/* Get Offerings */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              GET{" "}
              <code className="text-orange-600 dark:text-orange-400">
                /api/departments/{"{deptId}"}/courses/{"{courseId}"}/offerings
              </code>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Returns all offerings for a course across the last 12 semesters.
            </p>

            <table className="w-full mb-3 text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-2 text-gray-900 dark:text-white">Parameter</th>
                  <th className="text-left py-2 text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-2 text-gray-600 dark:text-gray-300">deptId</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Department ID</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-2 text-gray-600 dark:text-gray-300">courseId</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Course ID</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Example Request:</p>
              <code className="text-sm text-orange-600 dark:text-orange-400">
                GET /api/departments/1/courses/42/offerings
              </code>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-2">Example Response:</p>
              <pre className="text-sm overflow-x-auto">
                {`[
  {
    "section": "D100",
    "infoUrl": "/browse/info/2025fa-cmpt-120-d1",
    "term": "Fall",
    "year": 2025,
    "semesterCode": 1257,
    "isEnrolling": true,
    "location": "Burnaby",
    "instructors": "John Doe",
    "enrolled": "96",
    "capacity": "100",
    "loadPercent": 96
  }
]`}
              </pre>
            </div>
          </div>

          {/* Get Offering Detail */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              GET{" "}
              <code className="text-orange-600 dark:text-orange-400">
                /api/departments/{"{deptId}"}/courses/{"{courseId}"}/offerings/{"{semesterCode}"}
              </code>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Returns detailed information about a course offering for a specific semester, including grade statistics
              and all sections.
            </p>

            <table className="w-full mb-3 text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-2 text-gray-900 dark:text-white">Parameter</th>
                  <th className="text-left py-2 text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-2 text-gray-600 dark:text-gray-300">deptId</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Department ID</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-2 text-gray-600 dark:text-gray-300">courseId</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Course ID</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-2 text-gray-600 dark:text-gray-300">semesterCode</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Semester code (e.g., 1257 for Fall 2025)</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Example Request:</p>
              <code className="text-sm text-orange-600 dark:text-orange-400">
                GET /api/departments/1/courses/42/offerings/1257
              </code>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-2">Example Response:</p>
              <pre className="text-sm overflow-x-auto">
                {`{
  "deptCode": "CMPT",
  "courseNumber": "120",
  "title": "Introduction to Computing Science I",
  "year": 2025,
  "term": "Fall",
  "campus": "Burnaby",
  "medianGrade": "B+",
  "failRate": 8.5,
  "gradeDistribution": {
    "A+": 15,
    "A": 25,
    "A-": 20,
    "B+": 18,
    "B": 12
  },
  "description": "An elementary introduction...",
  "prerequisites": "BC Math 12",
  "corequisites": null,
  "units": 3,
  "degreeLevel": "UGRD",
  "designation": "Q",
  "sections": [
    {
      "section": "D100",
      "infoUrl": "/browse/info/2025fa-cmpt-120-d1",
      "term": "Fall",
      "year": 2025,
      "semesterCode": 1257,
      "isEnrolling": true,
      "location": "Burnaby",
      "instructors": "John Doe",
      "enrolled": "96",
      "capacity": "100",
      "loadPercent": 96
    }
  ],
  "outlineUrl": "https://www.sfu.ca/outlines.html?dept=CMPT&number=120"
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Graph Endpoints */}
        <div className="light-card dark:dark-card p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Graph & Statistics</h2>

          {/* Grade Distribution */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              GET <code className="text-orange-600 dark:text-orange-400">/api/graph/grade-distribution</code>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Returns grade distribution statistics from CourseDiggers.
            </p>

            <table className="w-full mb-3 text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-2 text-gray-900 dark:text-white">Parameter</th>
                  <th className="text-left py-2 text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-2 text-gray-600 dark:text-gray-300">courseId</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Course ID (query parameter)</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Example Request:</p>
              <code className="text-sm text-orange-600 dark:text-orange-400">
                GET /api/graph/grade-distribution?courseId=42
              </code>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-2">Example Response:</p>
              <pre className="text-sm overflow-x-auto">
                {`{
  "deptCode": "CMPT",
  "courseNumber": "120",
  "title": "Introduction to Computing Science I",
  "medianGrade": "B+",
  "failRate": 8.5,
  "gradeDistribution": {
    "A+": 15,
    "A": 25,
    "A-": 20,
    "B+": 18,
    "B": 12,
    "B-": 8,
    "C+": 5,
    "C": 3,
    "C-": 2,
    "D": 1,
    "F": 1
  }
}`}
              </pre>
            </div>
          </div>

          {/* Enrollment History */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              GET <code className="text-orange-600 dark:text-orange-400">/api/graph/enrollment-history</code>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Returns enrollment history for a course over time (live data from CourseSys).
            </p>

            <table className="w-full mb-3 text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-2 text-gray-900 dark:text-white">Parameter</th>
                  <th className="text-left py-2 text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-2 text-gray-600 dark:text-gray-300">deptId</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Department ID (query parameter)</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-2 text-gray-600 dark:text-gray-300">courseId</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Course ID (query parameter)</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <td className="py-2 text-gray-600 dark:text-gray-300">range</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">
                    Time range: "1yr", "3yr", or "5yr" (optional, default: "5yr")
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Example Request:</p>
              <code className="text-sm text-orange-600 dark:text-orange-400">
                GET /api/graph/enrollment-history?deptId=1&courseId=42&range=3yr
              </code>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-2">Example Response:</p>
              <pre className="text-sm overflow-x-auto">
                {`[
  {
    "semesterCode": 1227,
    "term": "Fall",
    "year": 2022,
    "totalEnrolled": 450,
    "totalCapacity": 500,
    "loadPercent": 90.0
  },
  {
    "semesterCode": 1231,
    "term": "Spring",
    "year": 2023,
    "totalEnrolled": 380,
    "totalCapacity": 400,
    "loadPercent": 95.0
  }
]`}
              </pre>
            </div>
          </div>
        </div>

        {/* Semester Code Format */}
        <div className="light-card dark:dark-card p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Semester Code Format</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Semester codes are 4-digit numbers in the format YYYC where:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              <strong>YYY</strong>: Year offset from 1900 (e.g., 125 = 2025)
            </li>
            <li>
              <strong>C</strong>: Term code (1 = Spring, 4 = Summer, 7 = Fall)
            </li>
          </ul>

          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Examples:</p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>1251 = Spring 2025</li>
              <li>1254 = Summer 2025</li>
              <li>1257 = Fall 2025</li>
              <li>1261 = Spring 2026</li>
            </ul>
          </div>
        </div>

        {/* Notes */}
        <div className="light-card dark:dark-card p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Notes</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>All endpoints return JSON</li>
            <li>Enrollment data is fetched live from SFU CourseSys</li>
            <li>Grade distribution data is sourced from CourseDiggers</li>
            <li>CORS is enabled for web applications</li>
            <li>No authentication required for public endpoints</li>
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}

export default function ApiDocsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ApiDocsPageContent />
    </Suspense>
  );
}
