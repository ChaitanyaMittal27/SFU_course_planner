"use client";

import { useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { api, Department, Course, EnrollmentDataPoint } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Dot,
} from "recharts";

export default function LoadOverTimePage() {
  // ============================================
  // URL STATE (nuqs)
  // ============================================
  const [selectedDeptId, setSelectedDeptId] = useQueryState("deptId");
  const [selectedCourseId, setSelectedCourseId] = useQueryState("courseId");
  const [range, setRange] = useQueryState("range", { defaultValue: "5yr" });

  // ============================================
  // LOCAL STATE
  // ============================================
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chartData, setChartData] = useState<EnrollmentDataPoint[]>([]);

  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH DEPARTMENTS (on mount)
  // ============================================
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await api.getDepartments();
        setDepartments(data);
      } catch (err) {
        setError("Failed to load departments");
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, []);

  // ============================================
  // FETCH COURSES (when dept changes)
  // ============================================
  useEffect(() => {
    if (!selectedDeptId) {
      setCourses([]);
      setSelectedCourseId(null);
      setChartData([]);
      return;
    }

    const fetchCourses = async () => {
      setLoadingCourses(true);
      setError(null);
      try {
        const data = await api.getCourses(parseInt(selectedDeptId));
        setCourses(data);
      } catch (err) {
        setError("Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [selectedDeptId, setSelectedCourseId]);

  // ============================================
  // FETCH CHART DATA (when course or range changes)
  // ============================================
  useEffect(() => {
    if (!selectedDeptId || !selectedCourseId) {
      setChartData([]);
      return;
    }

    const fetchChartData = async () => {
      setLoadingChart(true);
      setError(null);
      try {
        const data = await api.getEnrollmentHistory(parseInt(selectedDeptId), parseInt(selectedCourseId), range);
        setChartData(data);
      } catch (err: any) {
        setError("Failed to load enrollment data");
        setChartData([]);
      } finally {
        setLoadingChart(false);
      }
    };

    fetchChartData();
  }, [selectedDeptId, selectedCourseId, range]);

  // ============================================
  // HELPERS
  // ============================================
  const selectedDept = departments.find((d) => d.deptId === parseInt(selectedDeptId || "0"));
  const selectedCourse = courses.find((c) => c.courseId === parseInt(selectedCourseId || "0"));

  // Format semester label for chart
  const formatSemester = (semesterCode: number) => {
    const year = Math.floor(semesterCode / 10) - 1900;
    const termCode = semesterCode % 10;
    const term = termCode === 1 ? "Sp" : termCode === 4 ? "Su" : "Fa";
    return `${term} ${year}`;
  };

  // Get color based on load percentage
  const getLoadColor = (load: number) => {
    if (load < 80) return "#10b981"; // Green
    if (load < 95) return "#f59e0b"; // Yellow/Amber
    return "#ef4444"; // Red
  };

  // Custom dot for line chart with color coding
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const color = getLoadColor(payload.loadPercent);
    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
  };

  // ============================================
  // RENDER
  // ============================================
  if (loadingDepts) {
    return (
      <PageContainer title="Load Over Time">
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Load Over Time</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Track enrollment percentage across semesters</p>
          </div>
        </div>
      </div>

      {/* COURSE SELECTION */}
      <div className="light-card dark:dark-card p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Course</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Department Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
            <select
              title="dept"
              value={selectedDeptId || ""}
              onChange={(e) => setSelectedDeptId(e.target.value || null)}
              className="input-field"
            >
              <option value="">Select a department...</option>
              {departments.map((dept) => (
                <option key={dept.deptId} value={dept.deptId}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
            <select
              title="course"
              value={selectedCourseId || ""}
              onChange={(e) => setSelectedCourseId(e.target.value || null)}
              className="input-field"
              disabled={!selectedDeptId || loadingCourses}
            >
              <option value="">{loadingCourses ? "Loading courses..." : "Select a course..."}</option>
              {courses
                .sort((a, b) => a.courseNumber.localeCompare(b.courseNumber))
                .map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.courseNumber} - {course.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Selected Course Info + Range Selector */}
        {selectedDept && selectedCourse && (
          <div className="mt-4 space-y-4">
            {/* Course Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedDept.name} {selectedCourse.courseNumber} - {selectedCourse.title}
                </span>
              </div>
            </div>

            {/* Range Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Range</label>
              <div className="flex space-x-2">
                {["1yr", "3yr", "5yr"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      range === r
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {r === "1yr" ? "1 Year" : r === "3yr" ? "3 Years" : "5 Years"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ERROR STATE */}
      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}

      {/* LOADING STATE */}
      {loadingChart && (
        <div className="light-card dark:dark-card p-8">
          <LoadingSpinner />
        </div>
      )}

      {/* CHART */}
      {!loadingChart && !error && chartData.length > 0 && (
        <div className="light-card dark:dark-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enrollment Load (%)</h3>

            {/* Legend */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600 dark:text-gray-400">&lt; 80%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600 dark:text-gray-400">80-95%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">&gt; 95%</span>
              </div>
            </div>
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="semesterCode" tickFormatter={formatSemester} angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} label={{ value: "Load %", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {data.term} {data.year}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enrolled: {data.enrolled} / {data.capacity}
                          </p>
                          <p className="text-sm font-medium" style={{ color: getLoadColor(data.loadPercent) }}>
                            Load: {data.loadPercent.toFixed(1)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
                <ReferenceLine y={95} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                <Line
                  type="monotone"
                  dataKey="loadPercent"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loadingChart && !error && chartData.length === 0 && selectedCourseId && (
        <div className="light-card dark:dark-card p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No enrollment data found for this course in the selected time range.
          </p>
        </div>
      )}

      {/* NO SELECTION STATE */}
      {!selectedCourseId && (
        <div className="light-card dark:dark-card p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Course Selected</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Select a department and course above to view load over time
          </p>
        </div>
      )}
    </PageContainer>
  );
}
