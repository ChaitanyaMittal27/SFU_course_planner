"use client";

import LoadingSpinner from "@/components/LoadingSpinner";
import PageContainer from "@/components/PageContainer";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { displayStyles, headerStyles, bodyStyles } from "@/app/fonts";

function ApiDocsPageContent() {
  const API_BASE = "https://api.sfucourseplanner.com";

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${displayStyles.sm} text-text-primary mb-4`}>API Documentation</h1>
          <p className={`${headerStyles.md} text-text-muted`}>
            Public REST API for accessing SFU course data, enrollment statistics, and grade distributions.
          </p>
        </div>

        {/* Base URL */}
        <Card className="p-6 mb-8">
          <h2 className={`${headerStyles.md} text-text-primary mb-3`}>Base URL</h2>
          <code className="bg-surface-raised px-3 py-2 rounded text-accent">{API_BASE}</code>
        </Card>

        {/* About Endpoint */}
        <Card className="p-6 mb-6">
          <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>About</h2>

          <div className="mb-6">
            <h3 className={`${headerStyles.md} text-text-primary mb-2`}>
              GET <code className="text-accent">/api/about</code>
            </h3>
            <p className={`${bodyStyles.md} text-text-muted mb-3`}>Returns application metadata.</p>

            <div className="bg-surface-raised p-4 rounded-lg mb-3">
              <p className={`${bodyStyles.md} text-text-muted mb-2`}>Example Response:</p>
              <pre className="text-sm overflow-x-auto text-text-primary">
                {`{
  "appName": "CoursePlanner",
  "authorName": "Anonymouse"
}`}
              </pre>
            </div>
          </div>
        </Card>

        {/* Browse Endpoints */}
        <Card className="p-6 mb-6">
          <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>Browse</h2>

          <div className="mb-8">
            <h3 className={`${headerStyles.md} text-text-primary mb-2`}>
              GET <code className="text-accent">/api/departments</code>
            </h3>
            <p className={`${bodyStyles.md} text-text-muted mb-3`}>Returns all departments at SFU.</p>

            <div className="bg-surface-raised p-4 rounded-lg mb-3">
              <p className={`${bodyStyles.md} text-text-muted mb-2`}>Example Response:</p>
              <pre className="text-sm overflow-x-auto text-text-primary">
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

          <div className="mb-8">
            <h3 className={`${headerStyles.md} text-text-primary mb-2`}>
              GET <code className="text-accent">/api/departments/{"{deptId}"}/courses</code>
            </h3>
            <p className={`${bodyStyles.md} text-text-muted mb-3`}>Returns all courses in a department.</p>

            <table className="w-full mb-3 text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={`text-left py-2 ${bodyStyles.md} text-text-primary`}>Parameter</th>
                  <th className={`text-left py-2 ${bodyStyles.md} text-text-primary`}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className={`py-2 ${bodyStyles.md} text-text-muted`}>deptId</td>
                  <td className={`py-2 ${bodyStyles.md} text-text-muted`}>Department ID (from /api/departments)</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-surface-raised p-4 rounded-lg mb-3">
              <p className={`${bodyStyles.md} text-text-muted mb-2`}>Example Request:</p>
              <code className="text-sm text-accent">GET /api/departments/1/courses</code>

              <p className={`${bodyStyles.md} text-text-muted mt-4 mb-2`}>Example Response:</p>
              <pre className="text-sm overflow-x-auto text-text-primary">
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

          <div className="mb-8">
            <h3 className={`${headerStyles.md} text-text-primary mb-2`}>
              GET{" "}
              <code className="text-accent">
                /api/departments/{"{deptId}"}/courses/{"{courseId}"}/offerings
              </code>
            </h3>
            <p className={`${bodyStyles.md} text-text-muted mb-3`}>
              Returns all offerings for a course across the last 12 semesters.
            </p>

            <table className="w-full mb-3 text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={`text-left py-2 ${bodyStyles.md} text-text-primary`}>Parameter</th>
                  <th className={`text-left py-2 ${bodyStyles.md} text-text-primary`}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[["deptId", "Department ID"], ["courseId", "Course ID"]].map(([p, d]) => (
                  <tr key={p} className="border-b border-border">
                    <td className={`py-2 ${bodyStyles.md} text-text-muted`}>{p}</td>
                    <td className={`py-2 ${bodyStyles.md} text-text-muted`}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-surface-raised p-4 rounded-lg mb-3">
              <p className={`${bodyStyles.md} text-text-muted mb-2`}>Example Request:</p>
              <code className="text-sm text-accent">GET /api/departments/1/courses/42/offerings</code>

              <p className={`${bodyStyles.md} text-text-muted mt-4 mb-2`}>Example Response:</p>
              <pre className="text-sm overflow-x-auto text-text-primary">
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

          <div className="mb-8">
            <h3 className={`${headerStyles.md} text-text-primary mb-2`}>
              GET{" "}
              <code className="text-accent">
                /api/departments/{"{deptId}"}/courses/{"{courseId}"}/offerings/{"{semesterCode}"}
              </code>
            </h3>
            <p className={`${bodyStyles.md} text-text-muted mb-3`}>
              Returns detailed information about a course offering for a specific semester, including grade statistics
              and all sections.
            </p>

            <table className="w-full mb-3 text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={`text-left py-2 ${bodyStyles.md} text-text-primary`}>Parameter</th>
                  <th className={`text-left py-2 ${bodyStyles.md} text-text-primary`}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["deptId", "Department ID"],
                  ["courseId", "Course ID"],
                  ["semesterCode", "Semester code (e.g., 1257 for Fall 2025)"],
                ].map(([p, d]) => (
                  <tr key={p} className="border-b border-border">
                    <td className={`py-2 ${bodyStyles.md} text-text-muted`}>{p}</td>
                    <td className={`py-2 ${bodyStyles.md} text-text-muted`}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-surface-raised p-4 rounded-lg mb-3">
              <p className={`${bodyStyles.md} text-text-muted mb-2`}>Example Request:</p>
              <code className="text-sm text-accent">GET /api/departments/1/courses/42/offerings/1257</code>

              <p className={`${bodyStyles.md} text-text-muted mt-4 mb-2`}>Example Response:</p>
              <pre className="text-sm overflow-x-auto text-text-primary">
                {`{
  "deptCode": "CMPT",
  "courseNumber": "120",
  "title": "Introduction to Computing Science I",
  "year": 2025,
  "term": "Fall",
  "campus": "Burnaby",
  "medianGrade": "B+",
  "failRate": 8.5,
  "gradeDistribution": { "A+": 15, "A": 25 },
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
        </Card>

        {/* Graph Endpoints */}
        <Card className="p-6 mb-6">
          <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>Graph & Statistics</h2>

          <div className="mb-8">
            <h3 className={`${headerStyles.md} text-text-primary mb-2`}>
              GET <code className="text-accent">/api/graph/grade-distribution</code>
            </h3>
            <p className={`${bodyStyles.md} text-text-muted mb-3`}>
              Returns grade distribution statistics from CourseDiggers.
            </p>

            <table className="w-full mb-3 text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={`text-left py-2 ${bodyStyles.md} text-text-primary`}>Parameter</th>
                  <th className={`text-left py-2 ${bodyStyles.md} text-text-primary`}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className={`py-2 ${bodyStyles.md} text-text-muted`}>courseId</td>
                  <td className={`py-2 ${bodyStyles.md} text-text-muted`}>Course ID (query parameter)</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-surface-raised p-4 rounded-lg">
              <p className={`${bodyStyles.md} text-text-muted mb-2`}>Example Request:</p>
              <code className="text-sm text-accent">GET /api/graph/grade-distribution?courseId=42</code>
            </div>
          </div>

          <div className="mb-8">
            <h3 className={`${headerStyles.md} text-text-primary mb-2`}>
              GET <code className="text-accent">/api/graph/enrollment-history</code>
            </h3>
            <p className={`${bodyStyles.md} text-text-muted mb-3`}>
              Returns enrollment history for a course over time (live data from CourseSys).
            </p>

            <table className="w-full mb-3 text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={`text-left py-2 ${bodyStyles.md} text-text-primary`}>Parameter</th>
                  <th className={`text-left py-2 ${bodyStyles.md} text-text-primary`}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["deptId", "Department ID (query parameter)"],
                  ["courseId", "Course ID (query parameter)"],
                  ["range", 'Time range: "1yr", "3yr", or "5yr" (optional, default: "5yr")'],
                ].map(([p, d]) => (
                  <tr key={p} className="border-b border-border">
                    <td className={`py-2 ${bodyStyles.md} text-text-muted`}>{p}</td>
                    <td className={`py-2 ${bodyStyles.md} text-text-muted`}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-surface-raised p-4 rounded-lg">
              <p className={`${bodyStyles.md} text-text-muted mb-2`}>Example Request:</p>
              <code className="text-sm text-accent">
                GET /api/graph/enrollment-history?deptId=1&courseId=42&range=3yr
              </code>
            </div>
          </div>
        </Card>

        {/* Semester Code Format */}
        <Card className="p-6 mb-6">
          <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>Semester Code Format</h2>
          <p className={`${bodyStyles.md} text-text-muted mb-4`}>
            Semester codes are 4-digit numbers in the format YYYC where:
          </p>
          <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2`}>
            <li><strong>YYY</strong>: Year offset from 1900 (e.g., 125 = 2025)</li>
            <li><strong>C</strong>: Term code (1 = Spring, 4 = Summer, 7 = Fall)</li>
          </ul>

          <div className="bg-surface-raised p-4 rounded-lg mt-4">
            <p className={`${bodyStyles.md} text-text-muted mb-2`}>Examples:</p>
            <ul className={`${bodyStyles.md} space-y-1 text-text-muted`}>
              <li>1251 = Spring 2025</li>
              <li>1254 = Summer 2025</li>
              <li>1257 = Fall 2025</li>
              <li>1261 = Spring 2026</li>
            </ul>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-6 mb-6">
          <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>Notes</h2>
          <ul className={`list-disc list-inside ${bodyStyles.md} text-text-muted space-y-2`}>
            <li>All endpoints return JSON</li>
            <li>Enrollment data is fetched live from SFU CourseSys</li>
            <li>Grade distribution data is sourced from CourseDiggers</li>
            <li>CORS is enabled for web applications</li>
            <li>No authentication required for public endpoints</li>
          </ul>
        </Card>
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
