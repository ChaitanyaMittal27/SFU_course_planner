"use client";

import { useState, useEffect, Suspense } from "react";
import { useQueryState } from "nuqs";
import { BarChart2, Info, AlertCircle, ClipboardList } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import GradeHistogram from "@/components/GradeHistogram";
import { api, Department, Course, GradeDistribution } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

const selectClass =
  "w-full rounded-md border border-border bg-background text-text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

function GradeDistributionPageContent() {
  const [selectedDeptId, setSelectedDeptId] = useQueryState("deptId");
  const [selectedCourseId, setSelectedCourseId] = useQueryState("courseId");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [gradeData, setGradeData] = useState<GradeDistribution | null>(null);

  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const selectedDept = departments.find((d) => d.deptId === parseInt(selectedDeptId || "0"));
  const selectedCourse = courses.find((c) => c.courseId === parseInt(selectedCourseId || "0"));

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
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
            <BarChart2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className={`${displayStyles.sm} text-text-primary`}>Grade Distribution</h1>
            <p className={`${bodyStyles.md} text-text-muted mt-1`}>
              View historical grade breakdowns from CourseDiggers
            </p>
          </div>
        </div>
      </div>

      {/* COURSE SELECTION */}
      <Card className="p-6 mb-8">
        <CardContent className="p-0">
          <h2 className={`${headerStyles.md} text-text-primary mb-4`}>Select Course</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={`block ${labelStyles.md} text-text-primary mb-2`}>Department</label>
              <select
                title="dept"
                value={selectedDeptId || ""}
                onChange={(e) => setSelectedDeptId(e.target.value || null)}
                className={selectClass}
              >
                <option value="">Select a department...</option>
                {departments.map((dept) => (
                  <option key={dept.deptId} value={dept.deptId}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block ${labelStyles.md} text-text-primary mb-2`}>Course</label>
              <select
                title="course"
                value={selectedCourseId || ""}
                onChange={(e) => setSelectedCourseId(e.target.value || null)}
                className={selectClass}
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

          {selectedDept && selectedCourse && (
            <div className="mt-4 p-4 bg-accent/5 rounded-lg border border-accent/20 flex items-center space-x-2">
              <Info className="w-5 h-5 text-accent shrink-0" />
              <span className={`${labelStyles.lg} text-text-primary`}>
                {selectedDept.name} {selectedCourse.courseNumber} — {selectedCourse.title}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => {
            setError(null);
            if (selectedCourseId) window.location.reload();
          }}
        />
      )}

      {loadingGrades && (
        <Card className="p-8">
          <LoadingSpinner />
        </Card>
      )}

      {!loadingGrades && !error && gradeData && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardContent className="p-0 flex items-center space-x-3">
                <div className="w-12 h-12 bg-surface-raised rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-text-muted" />
                </div>
                <div>
                  <div className={`${bodyStyles.md} text-text-muted`}>Median Grade</div>
                  <div className={`${displayStyles.sm} text-text-primary`}>{gradeData.medianGrade || "N/A"}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0 flex items-center space-x-3">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <div className={`${bodyStyles.md} text-text-muted`}>Fail Rate</div>
                  <div className={`${displayStyles.sm} text-text-primary`}>
                    {gradeData.failRate != null ? `${gradeData.failRate.toFixed(2)}%` : "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="p-6">
            <CardContent className="p-0">
              <h3 className={`${headerStyles.md} text-text-primary mb-4`}>Grade Breakdown</h3>
              {gradeData.distribution && Object.keys(gradeData.distribution).length > 0 ? (
                <GradeHistogram distribution={gradeData.distribution} />
              ) : (
                <div className={`text-center py-8 ${bodyStyles.md} text-text-subtle`}>
                  No grade distribution data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardContent className="p-0 flex items-start space-x-2">
              <Info className="w-5 h-5 text-text-subtle shrink-0 mt-0.5" />
              <p className={`${bodyStyles.md} text-text-muted`}>
                Grade data sourced from CourseDiggers. This represents course-level historical averages and is not
                specific to individual semesters or instructors.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!loadingGrades && !error && !gradeData && selectedCourseId && (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-10 h-10 text-text-subtle" />
          </div>
          <h3 className={`${headerStyles.md} text-text-primary mb-2`}>No Data Available</h3>
          <p className={`${bodyStyles.md} text-text-muted`}>
            Grade distribution data is not available for this course.
          </p>
        </Card>
      )}

      {!selectedCourseId && (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-10 h-10 text-text-subtle" />
          </div>
          <h3 className={`${headerStyles.md} text-text-primary mb-2`}>No Course Selected</h3>
          <p className={`${bodyStyles.md} text-text-muted`}>
            Select a department and course above to view grade distribution
          </p>
        </Card>
      )}
    </PageContainer>
  );
}

export default function GradeDistributionPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GradeDistributionPageContent />
    </Suspense>
  );
}
