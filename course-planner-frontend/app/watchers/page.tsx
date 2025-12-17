"use client";

import { useEffect, useState, useMemo } from "react";
import { useQueryState } from "nuqs";
import { api } from "@/lib/api";
import type { Department, Course, Watcher } from "@/lib/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { Suspense } from "react";

function WatchersPageContent() {
  // URL State (selected watcher)
  const [watcherId, setWatcherId] = useQueryState("watcher");

  // Data
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Array<{ dept: Department; course: Course }>>([]);

  // Create Watcher State
  const [selectedDeptId, setSelectedDeptId] = useState<number | "">("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ dept: Department; course: Course }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Derived state
  const selectedDept = useMemo(
    () => departments.find((d) => d.deptId === selectedDeptId) ?? null,
    [departments, selectedDeptId]
  );

  const selectedWatcher = useMemo(
    () => watchers.find((w) => w.id === Number(watcherId)) ?? null,
    [watchers, watcherId]
  );

  // Loading states
  const [loadingWatchers, setLoadingWatchers] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [creatingWatcher, setCreatingWatcher] = useState(false);
  const [deletingWatcher, setDeletingWatcher] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ---- Load Watchers ----
  const loadWatchers = async () => {
    try {
      setLoadingWatchers(true);
      setError(null);
      const data = await api.getWatchers();
      setWatchers(data);
    } catch (e) {
      console.error("Failed to load watchers:", e);
      setError("Failed to load watchers. Please try again.");
    } finally {
      setLoadingWatchers(false);
    }
  };

  useEffect(() => {
    loadWatchers();
  }, []);

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
            console.error(`Failed to load courses for ${dept.name}:`, e);
          }
        }
        setAllCourses(allCoursesTemp);
      } catch (e) {
        console.error("Failed to load departments:", e);
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
    setSelectedDeptId(dept.deptId);
    setSelectedCourse(course);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // ---- When Department Changes ----
  useEffect(() => {
    if (selectedDeptId === "") {
      setCourses([]);
      setSelectedCourse(null);
      return;
    }

    (async () => {
      try {
        setLoadingCourses(true);
        const data = await api.getCourses(selectedDeptId);
        setCourses(data);
      } catch (e) {
        console.error("Failed to load courses:", e);
        setError("Failed to load courses.");
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, [selectedDeptId]);

  // ---- Create Watcher ----
  const handleCreateWatcher = async () => {
    if (!selectedDeptId || !selectedCourse) {
      setError("Please select a department and course.");
      return;
    }

    // Check if watcher already exists
    const exists = watchers.some(
      (w) => w.department.deptId === selectedDeptId && w.course.courseId === selectedCourse.courseId
    );

    if (exists) {
      setError(`You're already watching ${selectedDept?.name} ${selectedCourse.catalogNumber}.`);
      return;
    }

    try {
      setCreatingWatcher(true);
      setError(null);
      setSuccess(null);

      await api.createWatcher(selectedDeptId, selectedCourse.courseId);

      setSuccess(`Now watching ${selectedDept?.name} ${selectedCourse.catalogNumber}!`);
      await loadWatchers();

      // Reset form
      setSelectedDeptId("");
      setSelectedCourse(null);

      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error("Failed to create watcher:", e);
      setError("Failed to create watcher. Please try again.");
    } finally {
      setCreatingWatcher(false);
    }
  };

  // ---- Delete Watcher ----
  const handleDeleteWatcher = async (watcher: Watcher) => {
    if (!confirm(`Stop watching ${watcher.department.name} ${watcher.course.catalogNumber}?`)) {
      return;
    }

    try {
      setDeletingWatcher(watcher.id);
      setError(null);

      await api.deleteWatcher(watcher.id);

      setSuccess(`Stopped watching ${watcher.department.name} ${watcher.course.catalogNumber}`);
      await loadWatchers();

      // Clear selection if we deleted the selected watcher
      if (selectedWatcher?.id === watcher.id) {
        setWatcherId(null);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error("Failed to delete watcher:", e);
      setError("Failed to delete watcher. Please try again.");
    } finally {
      setDeletingWatcher(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Watchers</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Track courses and get notified when offerings change</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search courses to watch (e.g., CMPT 213, MATH 150)..."
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
                  <div className="text-sm text-gray-500 dark:text-gray-400">Create watcher for this course</div>
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

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-800 dark:text-green-300 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={() => setError(null)} />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Create Watcher Form */}
        <aside className="lg:col-span-3">
          <div className="light-card dark:dark-card border rounded-2xl p-5 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Watcher</h2>

            {/* Department Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <select
                title="inp_field"
                className="input-field"
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value ? Number(e.target.value) : "");
                  setSelectedCourse(null);
                }}
                disabled={loadingDepartments}
              >
                <option value="">Select department...</option>
                {departments.map((d) => (
                  <option key={d.deptId} value={d.deptId}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Dropdown */}
            {selectedDept && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
                {loadingCourses ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300 py-2">Loading courses...</div>
                ) : (
                  <select
                    title="inp-field"
                    className="input-field"
                    value={selectedCourse?.courseId || ""}
                    onChange={(e) => {
                      const course = courses.find((c) => c.courseId === Number(e.target.value));
                      setSelectedCourse(course || null);
                    }}
                  >
                    <option value="">Select course...</option>
                    {courses.map((c) => (
                      <option key={c.courseId} value={c.courseId}>
                        {c.catalogNumber}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreateWatcher}
              disabled={!selectedDept || !selectedCourse || creatingWatcher}
              className="w-full inline-block bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:hover:shadow-md"
            >
              {creatingWatcher ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Watcher"
              )}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              You'll be notified when this course has updates
            </p>
          </div>
        </aside>

        {/* CENTER: Active Watchers */}
        <section className="lg:col-span-6">
          <div className="light-card dark:dark-card border rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">My Watched Courses</h2>

            {loadingWatchers && (
              <div className="py-12">
                <LoadingSpinner />
              </div>
            )}

            {!loadingWatchers && watchers.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">No watched courses yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Search or select a course to start watching
                </p>
              </div>
            )}

            {watchers.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-xl border border-orange-200/50 dark:border-slate-700/60">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="table-header text-left">Department</th>
                        <th className="table-header text-left">Course</th>
                        <th className="table-header text-center">Events</th>
                        <th className="table-header text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {watchers.map((w) => {
                        const active = selectedWatcher?.id === w.id;
                        return (
                          <tr
                            key={w.id}
                            className={["table-row", active ? "bg-orange-100 dark:bg-slate-700/70" : ""].join(" ")}
                          >
                            <td className="table-cell font-medium">{w.department.name}</td>
                            <td className="table-cell">{w.course.catalogNumber}</td>
                            <td className="table-cell text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                {w.events.length}
                              </span>
                            </td>
                            <td className="table-cell">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setWatcherId(String(w.id))}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium underline"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDeleteWatcher(w)}
                                  disabled={deletingWatcher === w.id}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium underline disabled:opacity-50"
                                >
                                  {deletingWatcher === w.id ? "..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Click "View" to see events for a course</p>
              </>
            )}
          </div>
        </section>

        {/* RIGHT: Events Panel */}
        <aside className="lg:col-span-3">
          <div className="light-card dark:dark-card border rounded-2xl p-5 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recent Events</h2>

            {!selectedWatcher ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm">Select a course to view its events</p>
              </div>
            ) : (
              <>
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Watching:</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {selectedWatcher.department.name} {selectedWatcher.course.catalogNumber}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                      {selectedWatcher.events.length} event(s)
                    </span>
                  </div>
                </div>

                {selectedWatcher.events.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 dark:text-gray-300 text-sm">No events yet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Events appear when course offerings change
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    {selectedWatcher.events.map((event, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-orange-50 dark:bg-slate-700/50 rounded-lg border border-orange-200 dark:border-slate-600"
                      >
                        <div className="flex items-start">
                          <svg
                            className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 mr-2 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words flex-1">
                            {event}
                          </p>
                        </div>
                      </div>
                    ))}
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

export default function WatchersPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <WatchersPageContent />
    </Suspense>
  );
}
