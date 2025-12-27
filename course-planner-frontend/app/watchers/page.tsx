"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import GradeHistogram from "@/components/GradeHistogram";
import { useQueryState } from "nuqs";
import { api } from "@/lib/api";
import type { Course, CourseOffering, Department } from "@/lib/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

// ----------------------------
// Helpers
// ----------------------------
function sortAlphaNum(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function formatSemesterLabel(o: CourseOffering) {
  // Example: "Spring 2026"
  return `${o.term} ${o.year}`;
}

function badgeClasses(kind: "enrolling" | "past") {
  if (kind === "enrolling") {
    return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
  }
  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-200";
}

function extractSection(section: string) {
  // Handles: "D100", "CMPT 120 D100", "CMPT 120 D100"
  const parts = section.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

// ----------------------------
// Full-screen detail component
// ----------------------------
type OfferingDetail = {
  deptCode: string;
  courseNumber: string;
  title: string;
  year: number;
  term: string;
  campus: string | null;

  medianGrade: string | null;
  failRate: number;
  gradeDistribution: Record<string, number> | null;

  description: string | null;
  prerequisites: string | null;
  corequisites: string | null;
  units: number;
  degreeLevel: string | null;
  designation: string | null;

  sections: CourseOffering[]; // You’re currently returning section rows via ApiCourseOfferingDTO mapping in detail too
  outlineUrl: string;
};

function OfferingDetailScreen({ detail, onBack }: { detail: OfferingDetail; onBack: () => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 hover:bg-orange-100 dark:hover:bg-slate-600 transition"
      >
        ← Back to offerings
      </button>

      <div className="light-card dark:dark-card border rounded-2xl p-6">
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {detail.deptCode.toUpperCase()} {detail.courseNumber}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{detail.title}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {detail.term} {detail.year}
            {detail.campus ? ` • ${detail.campus}` : ""}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4 border-orange-200/50 dark:border-slate-700/60">
            <div className="text-xs text-gray-500 dark:text-gray-400">Units</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{detail.units}</div>
          </div>

          <div className="border rounded-xl p-4 border-orange-200/50 dark:border-slate-700/60">
            <div className="text-xs text-gray-500 dark:text-gray-400">Median Grade</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{detail.medianGrade ?? "N/A"}</div>
          </div>

          <div className="border rounded-xl p-4 border-orange-200/50 dark:border-slate-700/60">
            <div className="text-xs text-gray-500 dark:text-gray-400">Fail Rate</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {Number.isFinite(detail.failRate) ? `${detail.failRate.toFixed(2)}%` : "N/A"}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {detail.degreeLevel && (
            <span className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 text-sm">
              {detail.degreeLevel}
            </span>
          )}

          {detail.designation && (
            <span className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 text-sm">
              {detail.designation}
            </span>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {detail.description && (
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Description</div>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{detail.description}</p>
            </div>
          )}

          {(detail.prerequisites || detail.corequisites) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-xl p-4 border-orange-200/50 dark:border-slate-700/60">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Prerequisites</div>
                <p className="text-sm text-gray-700 dark:text-gray-200">{detail.prerequisites ?? "None"}</p>
              </div>

              <div className="border rounded-xl p-4 border-orange-200/50 dark:border-slate-700/60">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Corequisites</div>
                <p className="text-sm text-gray-700 dark:text-gray-200">{detail.corequisites ?? "None"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sections table */}
        <div className="mt-8">
          <div className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sections</div>
          {detail.sections.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">No section data found.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-orange-200/50 dark:border-slate-700/60">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header text-left">Section</th>
                    <th className="table-header text-left">Instructor</th>
                    <th className="table-header text-left">Campus</th>
                    <th className="table-header text-left">Enrolled</th>
                    <th className="table-header text-left">Capacity</th>
                    <th className="table-header text-left">Load</th>
                    <th className="table-header text-left">Jump to Outline</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.sections.map((s) => (
                    <tr key={s.section} className="table-row cursor-default">
                      <td className="table-cell">{s.section}</td>
                      <td className="table-cell">{s.instructors || "—"}</td>
                      <td className="table-cell">{s.location || "—"}</td>
                      <td className="table-cell">{s.enrolled}</td>
                      <td className="table-cell">{s.capacity}</td>
                      <td className="table-cell">{s.loadPercent ?? 0}%</td>
                      <td className="table-cell">
                        <a
                          href={`https://www.sfu.ca/outlines.html?${
                            detail.year
                          }/${detail.term.toLowerCase()}/${detail.deptCode.toLowerCase()}/${detail.courseNumber.toLowerCase()}/${extractSection(
                            s.section
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-600 hover:underline"
                        >
                          Open outline
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Grade distribution chart) */}
        {detail.gradeDistribution && (
          <div className="mt-8">
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Grade Distribution</div>

            <GradeHistogram distribution={detail.gradeDistribution} />

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Based on Coursediggers data. For more information refer to{" "}
              <a
                href="https://coursediggers.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline"
              >
                Coursediggers
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------
// Main browse page
// ----------------------------
function BrowsePageContent() {
  // URL State
  const [deptId, setDeptId] = useQueryState("dept");
  const [courseId, setCourseId] = useQueryState("course");

  // Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);

  // New: full screen offering detail
  const [offeringDetail, setOfferingDetail] = useState<OfferingDetail | null>(null);

  // UI state
  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);

  // Search (NO loading all courses upfront anymore)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ dept: Department; course: Course }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Cache courses per dept (so switching back is instant)
  const [courseCache, setCourseCache] = useState<Record<number, Course[]>>({});

  // Loading
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDept = useMemo(
    () => departments.find((d) => d.deptId === Number(deptId)) ?? null,
    [departments, deptId]
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => c.courseId === Number(courseId)) ?? null,
    [courses, courseId]
  );

  // ----------------------------
  // 1) Load ONLY departments on mount
  // ----------------------------
  useEffect(() => {
    (async () => {
      try {
        setLoadingDepartments(true);
        const data = await api.getDepartments();
        // sort by deptCode if you have it; fallback to name
        const sorted = [...data].sort((a, b) => sortAlphaNum(a.deptCode ?? a.name, b.deptCode ?? b.name));
        setDepartments(sorted);
      } catch {
        setError("Failed to load departments.");
      } finally {
        setLoadingDepartments(false);
      }
    })();
  }, []);

  // ----------------------------
  // 2) When dept changes: load courses for that dept only (with cache)
  // ----------------------------
  useEffect(() => {
    if (!deptId) {
      setCourses([]);
      setCourseId(null);
      setOfferings([]);
      setSelectedOffering(null);
      setOfferingDetail(null);
      return;
    }

    const did = Number(deptId);
    (async () => {
      try {
        setError(null);
        setOfferingDetail(null);
        setSelectedOffering(null);
        setOfferings([]);
        setLoadingCourses(true);

        // cache hit
        if (courseCache[did]) {
          setCourses(courseCache[did]);
          return;
        }

        const data = await api.getCourses(did);

        const sorted = [...data].sort((a, b) => sortAlphaNum(a.courseNumber, b.courseNumber));
        setCourses(sorted);
        setCourseCache((prev) => ({ ...prev, [did]: sorted }));
      } catch {
        setError("Failed to load courses.");
      } finally {
        setLoadingCourses(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptId]);

  // ----------------------------
  // 3) When course changes: load offerings
  // ----------------------------
  useEffect(() => {
    if (!deptId || !courseId) {
      setOfferings([]);
      setSelectedOffering(null);
      setOfferingDetail(null);
      return;
    }

    (async () => {
      try {
        setError(null);
        setLoadingOfferings(true);
        setOfferings([]);
        setSelectedOffering(null);
        setOfferingDetail(null);

        const data = await api.getOfferings(Number(deptId), Number(courseId));
        const sorted = [...data].sort((a, b) => b.semesterCode - a.semesterCode);
        setOfferings(sorted);
      } catch {
        setError("Failed to load course offerings.");
      } finally {
        setLoadingOfferings(false);
      }
    })();
  }, [deptId, courseId]);

  // ----------------------------
  // 4) Search WITHOUT preloading all courses
  //    Pattern: "CMPT 213" → find dept by code → load that dept’s courses (cached) → filter
  // ----------------------------
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Attempt to parse: "CMPT 213" or "cmpt213"
    const match = q.toUpperCase().match(/^([A-Z]{2,5})\s*([0-9]{2,4}[A-Z]?)$/);
    if (!match) {
      // Don’t global-search across all departments unless you have a backend search endpoint
      setSearchResults([]);
      setShowSearchResults(true);
      return;
    }

    const deptCode = match[1];
    const courseNumPart = match[2];

    const dept = departments.find((d) => (d.deptCode ?? "").toUpperCase() === deptCode);
    if (!dept) {
      setSearchResults([]);
      setShowSearchResults(true);
      return;
    }

    (async () => {
      const did = dept.deptId;
      let deptCourses = courseCache[did];

      if (!deptCourses) {
        try {
          const data = await api.getCourses(did);
          const sorted = [...data].sort((a, b) => sortAlphaNum(a.courseNumber, b.courseNumber));
          deptCourses = sorted;
          setCourseCache((prev) => ({ ...prev, [did]: sorted }));
        } catch {
          setSearchResults([]);
          setShowSearchResults(true);
          return;
        }
      }

      const results = deptCourses
        .filter((c) => c.courseNumber.toUpperCase().includes(courseNumPart))
        .slice(0, 10)
        .map((course) => ({ dept, course }));

      setSearchResults(results);
      setShowSearchResults(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, departments]);

  const selectFromSearch = (dept: Department, course: Course) => {
    setDeptId(String(dept.deptId));
    setCourseId(String(course.courseId));
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // ----------------------------
  // 5) Click offering row → load full-screen detail
  // ----------------------------
  const openOfferingDetail = async (o: CourseOffering) => {
    if (!deptId || !courseId) return;
    try {
      setError(null);
      setSelectedOffering(o);
      setLoadingDetail(true);

      const data = await api.getOfferingDetail(Number(deptId), Number(courseId), o.semesterCode);
      setOfferingDetail(data);
    } catch {
      setError("Failed to load offering details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // If detail is open, show full-screen detail UI
  if (offeringDetail) {
    return (
      <OfferingDetailScreen
        detail={offeringDetail}
        onBack={() => {
          setOfferingDetail(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Watchers</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Track courses and get notified when offerings change</p>
      </div>

      {/* Search Bar (no global prefetch) */}
      <div className="mb-6 relative">
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search like: CMPT 213"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            className="w-full pl-12 pr-4 py-3 border-2 border-orange-200 dark:border-slate-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600 transition-all"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {showSearchResults && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map(({ dept, course }) => (
                  <button
                    key={`${dept.deptId}-${course.courseId}`}
                    onClick={() => selectFromSearch(dept, course)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {dept.deptCode} {course.courseNumber}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{dept.name}</div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
                  No matches. Use format like <span className="font-semibold">CMPT 213</span>.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={() => setError(null)} />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT */}
        <aside className="lg:col-span-3">
          <div className="light-card dark:dark-card border rounded-2xl p-5 sticky top-24">
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Department</div>

            <select
              title="select_dept"
              className="input-field"
              value={deptId || ""}
              onChange={(e) => {
                setDeptId(e.target.value || null);
                setCourseId(null);
              }}
              disabled={loadingDepartments}
            >
              <option value="">Select a department…</option>
              {departments.map((d) => (
                <option key={d.deptId} value={d.deptId}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="mt-6">
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {selectedDept ? `${selectedDept.deptCode.toUpperCase()} Courses` : "Courses"}
              </div>

              {loadingCourses && <div className="text-gray-600 dark:text-gray-300">Loading courses…</div>}

              {!loadingCourses && selectedDept && courses.length === 0 && (
                <div className="text-gray-600 dark:text-gray-300">No courses found.</div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                {courses.map((c) => {
                  const active = selectedCourse?.courseId === c.courseId;
                  return (
                    <button
                      key={c.courseId}
                      onClick={() => setCourseId(String(c.courseId))}
                      className={[
                        "px-3 py-2 rounded-lg text-sm font-medium transition",
                        active
                          ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md"
                          : "bg-orange-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 hover:bg-orange-100 dark:hover:bg-slate-600",
                      ].join(" ")}
                    >
                      {c.courseNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER */}
        <section className="lg:col-span-9">
          <div className="light-card dark:dark-card border rounded-2xl p-5">
            {!selectedCourse ? (
              <>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">Course Offerings</div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Select a department and course to view: enrolling term first, then previous terms.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedDept?.name} {selectedCourse.courseNumber}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Click a term row to open full details.
                    </div>
                  </div>
                </div>

                {loadingOfferings && <LoadingSpinner />}

                {!loadingOfferings && offerings.length === 0 && (
                  <div className="text-gray-600 dark:text-gray-300">No offerings found.</div>
                )}

                {/* all offerings 1 table */}
                {offerings.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-orange-200/50 dark:border-slate-700/60">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="table-header text-left">Term</th>
                          <th className="table-header text-left">Section</th>
                          <th className="table-header text-left">Instructor</th>
                          <th className="table-header text-left">Campus</th>
                          <th className="table-header text-left">Enrolled / Cap</th>
                          <th className="table-header text-left">Load</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offerings.map((o, idx) => {
                          const active = selectedOffering?.semesterCode === o.semesterCode;

                          // decide row base color
                          const baseRowBg =
                            idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-orange-50/40 dark:bg-slate-700/40";

                          // if enrolling, give a tint (but let active override)
                          const enrollingTint = o.isEnrolling ? "bg-green-50 dark:bg-green-900/20" : "";

                          // final bg class (active wins)
                          const bgClass = active ? "bg-orange-100 dark:bg-slate-700/70" : enrollingTint || baseRowBg;

                          const tdClass = `table-cell ${bgClass}`;

                          return (
                            <tr
                              key={`${o.semesterCode}-${o.section}`}
                              onClick={() => openOfferingDetail(o)}
                              className="cursor-pointer transition"
                            >
                              <td className={tdClass}>
                                {formatSemesterLabel(o)}
                                {o.isEnrolling && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                    Enrolling
                                  </span>
                                )}
                              </td>

                              <td className={tdClass}>{o.section}</td>
                              <td className={tdClass}>{o.instructors || "—"}</td>
                              <td className={tdClass}>{o.location || "—"}</td>
                              <td className={tdClass}>
                                {o.enrolled} / {o.capacity}
                              </td>
                              <td className={tdClass}>{o.loadPercent ?? 0}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {loadingDetail && (
                  <div className="mt-4">
                    <LoadingSpinner />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BrowsePageContent />
    </Suspense>
  );
}
