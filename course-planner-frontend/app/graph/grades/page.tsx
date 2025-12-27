"use client";

import { useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import GradeHistogram from "@/components/GradeHistogram";
import { api, Department, Course, GradeDistribution } from "@/lib/api";

export default function GradeDistributionPage() {
  // ============================================
  // URL STATE (nuqs)
  // ============================================
  const [selectedDeptId, setSelectedDeptId] = useQueryState("deptId");
  const [selectedCourseId, setSelectedCourseId] = useQueryState("courseId");

  // ============================================
  // LOCAL STATE
  // ============================================
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [gradeData, setGradeData] = useState<GradeDistribution | null>(null);

  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
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
      setGradeData(null);
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
  // FETCH GRADE DATA (when course changes)
  // ============================================
  useEffect(() => {
    if (!selectedCourseId) {
      setGradeData(null);
      return;
    }

    const fetchGrades = async () => {
      setLoadingGrades(true);
      setError(null);
      try {
        const data = await api.getGradeDistribution(parseInt(selectedCourseId));
        setGradeData(data);
      } catch (err: any) {
        if (err.message?.includes("404")) {
          setError("Grade distribution not available for this course");
        } else {
          setError("Failed to load grade distribution");
        }
        setGradeData(null);
      } finally {
        setLoadingGrades(false);
      }
    };

    fetchGrades();
  }, [selectedCourseId]);

  // ============================================
  // HELPERS
  // ============================================
  const selectedDept = departments.find((d) => d.deptId === parseInt(selectedDeptId || "0"));
  const selectedCourse = courses.find((c) => c.courseId === parseInt(selectedCourseId || "0"));

  // ============================================
  // RENDER
  // ============================================
  if (loadingDepts) {
    return (
      <PageContainer title="Grade Distribution">
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Grade Distribution</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">View historical grade breakdowns from CourseDiggers</p>
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

        {/* Selected Course Info */}
        {selectedDept && selectedCourse && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
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
        )}
      </div>

      {/* ERROR STATE */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => {
            setError(null);
            if (selectedCourseId) {
              window.location.reload();
            }
          }}
        />
      )}

      {/* LOADING STATE */}
      {loadingGrades && (
        <div className="light-card dark:dark-card p-8">
          <LoadingSpinner />
        </div>
      )}

      {/* GRADE DATA DISPLAY */}
      {!loadingGrades && !error && gradeData && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Median Grade */}
            <div className="light-card dark:dark-card p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Median Grade</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {gradeData.medianGrade || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Fail Rate */}
            <div className="light-card dark:dark-card p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Fail Rate</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {gradeData.failRate != null ? `${gradeData.failRate.toFixed(2)}%` : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Distribution Chart */}
          <div className="light-card dark:dark-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grade Breakdown</h3>
            {gradeData.distribution && Object.keys(gradeData.distribution).length > 0 ? (
              <GradeHistogram distribution={gradeData.distribution} />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No grade distribution data available
              </div>
            )}
          </div>

          {/* Data Source Note */}
          <div className="light-card dark:dark-card p-4">
            <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p>
                Grade data sourced from CourseDiggers. This represents course-level historical averages and is not
                specific to individual semesters or instructors.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loadingGrades && !error && !gradeData && selectedCourseId && (
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
          <p className="text-gray-600 dark:text-gray-400">Grade distribution data is not available for this course.</p>
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
            Select a department and course above to view grade distribution
          </p>
        </div>
      )}
    </PageContainer>
  );
}
