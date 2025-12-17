"use client";

import { useEffect, useState, useMemo } from "react";
import { useQueryState } from "nuqs";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

import { api } from "@/lib/api";
import type { Department, Course, CourseLoadData } from "@/lib/types";
import { formatSemester, getLoadColor, getLoadLabel } from "./graphUtils";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { Suspense } from "react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function GraphPageContent() {
  // URL State (managed by nuqs)
  const [deptId, setDeptId] = useQueryState("dept");
  const [courseId, setCourseId] = useQueryState("course");

  // Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [graphData, setGraphData] = useState<CourseLoadData[]>([]);
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

  const [selectedPoint, setSelectedPoint] = useState<CourseLoadData | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ dept: Department; course: Course }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Loading states
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingGraph, setLoadingGraph] = useState(false);
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
      setGraphData([]);
      setSelectedPoint(null);
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

  // ---- When Course Changes: Load Graph Data ----
  useEffect(() => {
    if (!deptId || !courseId) {
      setGraphData([]);
      setSelectedPoint(null);
      return;
    }

    (async () => {
      try {
        setError(null);
        setGraphData([]);
        setSelectedPoint(null);
        setLoadingGraph(true);

        const data = await api.getCourseLoad(Number(deptId), Number(courseId));
        setGraphData(data);
      } catch (e) {
        setError("Failed to load graph data.");
      } finally {
        setLoadingGraph(false);
      }
    })();
  }, [deptId, courseId]);

  // ---- Prepare Chart Data ----
  const chartData = {
    labels: graphData.map((d) => formatSemester(d.semester)),
    datasets: [
      {
        label: "Course Load (%)",
        data: graphData.map((d) => d.load),
        borderColor: "#FB923C",
        backgroundColor: "rgba(251, 146, 60, 0.1)",
        pointBackgroundColor: graphData.map((d) => getLoadColor(d.load)),
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setSelectedPoint(graphData[index]);
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#FB923C",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: (items) => {
            const index = items[0].dataIndex;
            return formatSemester(graphData[index].semester);
          },
          label: (context) => {
            const index = context.dataIndex;
            const data = graphData[index];
            return [`Enrolled: ${data.enrolled}`, `Capacity: ${data.capacity}`, `Load: ${data.load.toFixed(1)}%`];
          },
          afterLabel: (context) => {
            const index = context.dataIndex;
            const data = graphData[index];
            return `Status: ${getLoadLabel(data.load)}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
        title: {
          display: true,
          text: "Course Load (%)",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Semester",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Load Graph</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">View enrollment load trends for courses over time</p>
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

            {/* Legend */}
            {selectedCourse && graphData.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Load Status</div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
                    <span className="text-gray-700 dark:text-gray-300">0-80%: Comfortable</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-gray-700 dark:text-gray-300">81-90%: Getting Full</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                    <span className="text-gray-700 dark:text-gray-300">91-100%: At Capacity</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT: Graph */}
        <section className="lg:col-span-9">
          <div className="light-card dark:dark-card border rounded-2xl p-6">
            {!selectedCourse ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">
                    Select a department and course to view enrollment trends
                  </p>
                </div>
              </div>
            ) : loadingGraph ? (
              <div className="h-96 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : graphData.length === 0 ? (
              <div className="h-96 flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">No enrollment data available for this course</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedDept?.name} {selectedCourse.catalogNumber} - Enrollment Load Over Time
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Click on any point to see detailed information
                  </p>
                </div>

                <div className="h-96">
                  <Line data={chartData} options={chartOptions} />
                </div>

                {/* Details Panel */}
                {selectedPoint && (
                  <div className="mt-6 p-6 bg-orange-50 dark:bg-slate-700/50 rounded-xl border border-orange-200 dark:border-slate-600">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatSemester(selectedPoint.semester)} Details
                      </h3>
                      <button
                        title="select_point"
                        onClick={() => setSelectedPoint(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Enrollment</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedPoint.enrolled} / {selectedPoint.capacity}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Load</div>
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: getLoadColor(selectedPoint.load) }}
                          ></div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedPoint.load.toFixed(1)}%
                          </div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            ({getLoadLabel(selectedPoint.load)})
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Location</div>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedPoint.location}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Instructors</div>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedPoint.instructors}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/browse?dept=${deptId}&course=${courseId}`}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-medium hover:from-red-700 hover:to-orange-700 transition-all"
                    >
                      View All Offerings in Browse
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Note: Load calculated as (LEC enrollment / LEC capacity) × 100. Only lecture sections are included.
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function GraphPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GraphPageContent />
    </Suspense>
  );
}
