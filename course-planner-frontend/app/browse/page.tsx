"use client";

import { useEffect, useState, useMemo } from "react";
import { useQueryState } from "nuqs";
import { api } from "@/lib/api";
import type { Course, CourseOffering, Department, OfferingSection } from "@/lib/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { Suspense } from "react";

function BrowsePageContent() {
  // URL State (managed by nuqs)
  const [deptId, setDeptId] = useQueryState("dept");
  const [courseId, setCourseId] = useQueryState("course");

  // Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [offeringDetails, setOfferingDetails] = useState<OfferingSection[]>([]);
  const [allCourses, setAllCourses] = useState<Array<{ dept: Department; course: Course }>>([]);

  // Derived state
  const selectedDept = useMemo(
    () => departments.find((d) => d.deptId === Number(deptId)) ?? null,
    [departments, deptId]
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => c.courseId === Number(courseId)) ?? null,
    [courses, courseId]
  );

  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ dept: Department; course: Course }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Loading states
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Load Departments ----
  useEffect(() => {
    (async () => {
      try {
        setLoadingDepartments(true);
        const data = await api.getDepartments();
        setDepartments(data);

        // Load all courses for search
        const allCoursesTemp: Array<{ dept: Department; course: Course }> = [];
        for (const dept of data) {
          try {
            const deptCourses = await api.getCourses(dept.deptId);
            deptCourses.forEach((course) => {
              allCoursesTemp.push({ dept, course });
            });
          } catch (e) {
            // Skip departments that fail
          }
        }
        setAllCourses(allCoursesTemp);
      } catch (e) {
        setError("Failed to load departments.");
      } finally {
        setLoadingDepartments(false);
      }
    })();
  }, []);

  // ---- Search Logic ----
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = allCourses.filter(({ dept, course }) => {
      const deptName = dept.name.toLowerCase();
      const courseNum = course.catalogNumber.toLowerCase();
      const combined = `${deptName} ${courseNum}`;
      return combined.includes(query) || courseNum.includes(query);
    });

    setSearchResults(results.slice(0, 10));
    setShowSearchResults(true);
  }, [searchQuery, allCourses]);

  // ---- Select from Search ----
  const selectFromSearch = (dept: Department, course: Course) => {
    setDeptId(String(dept.deptId));
    setCourseId(String(course.courseId));
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // ---- When Department Changes ----
  useEffect(() => {
    if (!deptId) {
      setCourses([]);
      setCourseId(null);
      setOfferings([]);
      setSelectedOffering(null);
      setOfferingDetails([]);
      return;
    }

    (async () => {
      try {
        setError(null);
        setLoadingCourses(true);
        const data = await api.getCourses(Number(deptId));
        setCourses(data);
      } catch (e) {
        setError("Failed to load courses.");
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, [deptId]);

  // ---- When Course Changes ----
  useEffect(() => {
    if (!deptId || !courseId) {
      setOfferings([]);
      setSelectedOffering(null);
      setOfferingDetails([]);
      return;
    }

    (async () => {
      try {
        setError(null);
        setOfferings([]);
        setSelectedOffering(null);
        setOfferingDetails([]);
        setLoadingOfferings(true);

        const data = await api.getOfferings(Number(deptId), Number(courseId));
        const sortedData = data.sort((a, b) => b.semesterCode - a.semesterCode);
        setOfferings(sortedData);
      } catch (e) {
        setError("Failed to load course offerings.");
      } finally {
        setLoadingOfferings(false);
      }
    })();
  }, [deptId, courseId]);

  // ---- When Offering is Clicked ----
  useEffect(() => {
    if (!deptId || !courseId || !selectedOffering) return;

    (async () => {
      try {
        setError(null);
        setOfferingDetails([]);
        setLoadingDetails(true);

        const data = await api.getOfferingDetails(Number(deptId), Number(courseId), selectedOffering.courseOfferingId);

        setOfferingDetails(data);
      } catch (e) {
        setError("Failed to load offering details.");
      } finally {
        setLoadingDetails(false);
      }
    })();
  }, [deptId, courseId, selectedOffering]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Browse Courses</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Search or select a department, then a course, then click an offering to see section breakdown.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search courses (e.g., CMPT 213, MATH 150)..."
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

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {searchResults.map(({ dept, course }) => (
                <button
                  key={`${dept.deptId}-${course.courseId}`}
                  onClick={() => selectFromSearch(dept, course)}
                  className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {dept.name} {course.catalogNumber}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {dept.name} - Course {course.catalogNumber}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-600 rounded-lg shadow-xl p-4">
              <p className="text-gray-600 dark:text-gray-300">No courses found matching "{searchQuery}"</p>
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
        {/* LEFT: Department + Course Selector */}
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
                {selectedDept ? `${selectedDept.name} Courses` : "Courses"}
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
                      {c.catalogNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER: Offerings Table */}
        <section className="lg:col-span-6">
          <div className="light-card dark:dark-card border rounded-2xl p-5">
            {!selectedCourse ? (
              <>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">Course Offerings</div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Search or select a department and course from the left to view offerings.
                </p>
              </>
            ) : (
              <>
                <div className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Course Offerings for {selectedDept?.name} {selectedCourse.catalogNumber}
                </div>

                {loadingOfferings && <LoadingSpinner />}

                {!loadingOfferings && offerings.length === 0 && (
                  <div className="text-gray-600 dark:text-gray-300">No offerings found.</div>
                )}

                {offerings.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-orange-200/50 dark:border-slate-700/60">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="table-header text-left">Semester</th>
                          <th className="table-header text-left">Instructor(s)</th>
                          <th className="table-header text-left">Campus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offerings.map((o) => {
                          const active = selectedOffering?.courseOfferingId === o.courseOfferingId;
                          return (
                            <tr
                              key={o.courseOfferingId}
                              onClick={() => setSelectedOffering(o)}
                              className={["table-row", active ? "bg-orange-100 dark:bg-slate-700/70" : ""].join(" ")}
                            >
                              <td className="table-cell">
                                ({o.semesterCode}) {o.term} {o.year}
                              </td>
                              <td className="table-cell">with {o.instructors}</td>
                              <td className="table-cell">in {o.location}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Tip: Click a row to load "Offering Details" (section breakdown).
                </p>
              </>
            )}
          </div>
        </section>

        {/* RIGHT: Offering Details */}
        <aside className="lg:col-span-3">
          <div className="light-card dark:dark-card border rounded-2xl p-5 sticky top-24">
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Offering Details</div>

            {!selectedOffering ? (
              <p className="text-gray-600 dark:text-gray-300">
                Click an offering to see section types and enrollment totals.
              </p>
            ) : (
              <>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-3">
                  <div className="font-semibold">
                    ({selectedOffering.semesterCode}) {selectedOffering.term} {selectedOffering.year}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {selectedOffering.location} • {selectedOffering.instructors}
                  </div>
                </div>

                {loadingDetails && <LoadingSpinner />}

                {!loadingDetails && offeringDetails.length === 0 && (
                  <div className="text-gray-600 dark:text-gray-300">No details found.</div>
                )}

                {offeringDetails.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-orange-200/50 dark:border-slate-700/60">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="table-header text-left">Section Type</th>
                          <th className="table-header text-left">(# / Cap)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offeringDetails.map((s, idx) => (
                          <tr key={idx} className="table-row cursor-default">
                            <td className="table-cell">{s.type}</td>
                            <td className="table-cell">
                              ({s.enrollmentTotal} / {s.enrollmentCap})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
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
