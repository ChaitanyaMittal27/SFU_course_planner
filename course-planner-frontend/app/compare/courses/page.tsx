"use client";

import { useState, useEffect, Suspense } from "react";
import { useQueryState } from "nuqs";
import { ClipboardList, X } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import GradeHistogram from "@/components/GradeHistogram";
import { api, Department, Course, OfferingDetail } from "@/lib/api";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

const selectClass =
  "w-full rounded-md border border-border bg-background text-text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

type SelectedCourse = {
  deptId: number;
  courseId: number;
  deptCode: string;
  courseNumber: string;
};

function CourseComparisonContent() {
  const [coursesParam, setCoursesParam] = useQueryState("courses");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [comparisonData, setComparisonData] = useState<OfferingDetail[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
    loadFromURL();
  }, []);

  const loadDepartments = async () => {
    try {
      const depts = await api.getDepartments();
      setDepartments(depts);
    } catch (err) {
      setError("Failed to load departments");
    }
  };

  const loadFromURL = () => {
    if (!coursesParam) return;
    try {
      const parsed = coursesParam.split(",").map((pair) => {
        const [deptId, courseId] = pair.split(":").map(Number);
        return { deptId, courseId, deptCode: "", courseNumber: "" };
      });
      setSelectedCourses(parsed);
      fetchComparisonData(parsed);
    } catch {
      setError("Invalid URL parameters");
    }
  };

  const updateURL = (courses: SelectedCourse[]) => {
    if (courses.length === 0) {
      setCoursesParam(null);
    } else {
      setCoursesParam(courses.map((c) => `${c.deptId}:${c.courseId}`).join(","));
    }
  };

  useEffect(() => {
    if (selectedDept) loadCourses(selectedDept);
  }, [selectedDept]);

  const loadCourses = async (deptId: number) => {
    try {
      const coursesData = await api.getCourses(deptId);
      setCourses(coursesData);
    } catch {
      setError("Failed to load courses");
    }
  };

  const addCourse = () => {
    if (!selectedDept || !selectedCourse) return;
    if (selectedCourses.length >= 3) {
      setError("Maximum 3 courses allowed");
      return;
    }
    if (selectedCourses.some((c) => c.courseId === selectedCourse)) {
      setError("Course already added");
      return;
    }
    const dept = departments.find((d) => d.deptId === selectedDept);
    const course = courses.find((c) => c.courseId === selectedCourse);
    if (!dept || !course) return;

    const newCourse: SelectedCourse = {
      deptId: selectedDept,
      courseId: selectedCourse,
      deptCode: dept.deptCode,
      courseNumber: course.courseNumber,
    };
    const updated = [...selectedCourses, newCourse];
    setSelectedCourses(updated);
    updateURL(updated);
    setSelectedDept(null);
    setSelectedCourse(null);
    setCourses([]);
    setError(null);
  };

  const removeCourse = (courseId: number) => {
    const updated = selectedCourses.filter((c) => c.courseId !== courseId);
    setSelectedCourses(updated);
    updateURL(updated);
    setComparisonData([]);
  };

  const fetchComparisonData = async (courses: SelectedCourse[]) => {
    if (courses.length < 2) {
      setError("Select at least 2 courses to compare");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const latestSemester = 1267;
      const promises = courses.map((c) => api.getOfferingDetail(c.deptId, c.courseId, latestSemester));
      const results = await Promise.all(promises);
      setComparisonData(results);
    } catch (err) {
      setError("Failed to fetch course data. Some courses may not be offered this semester.");
      setComparisonData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${displayStyles.sm} text-text-primary mb-2`}>Compare Courses</h1>
          <p className={`${bodyStyles.md} text-text-muted`}>
            Select 2-3 courses to compare prerequisites, difficulty, and grade distributions.
          </p>
        </div>

        {/* Selection Panel */}
        <Card className="p-6 mb-8">
          <CardContent className="p-0">
            <h2 className={`${headerStyles.md} text-text-primary mb-4`}>Select Courses</h2>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={`block ${labelStyles.md} text-text-primary mb-2`}>Department</label>
                <select
                  title="dept"
                  value={selectedDept || ""}
                  onChange={(e) => setSelectedDept(Number(e.target.value))}
                  className={selectClass}
                >
                  <option value="">Select Department</option>
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
                  value={selectedCourse || ""}
                  onChange={(e) => setSelectedCourse(Number(e.target.value))}
                  className={selectClass}
                  disabled={!selectedDept}
                >
                  <option value="">Select Course</option>
                  {courses
                    .sort((a, b) => a.courseNumber.localeCompare(b.courseNumber))
                    .map((course) => (
                      <option key={course.courseId} value={course.courseId}>
                        {course.courseNumber} - {course.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={addCourse} disabled={!selectedCourse} className="w-full">
                  Add to Comparison
                </Button>
              </div>
            </div>

            {selectedCourses.length > 0 && (
              <div className="border-t border-border pt-4">
                <h3 className={`${labelStyles.md} text-text-muted mb-2`}>
                  Selected ({selectedCourses.length}/3):
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCourses.map((course) => (
                    <div
                      key={course.courseId}
                      className="bg-accent/10 text-accent px-3 py-1.5 rounded-lg flex items-center gap-2"
                    >
                      <span className={labelStyles.md}>
                        {course.deptCode} {course.courseNumber}
                      </span>
                      <button
                        onClick={() => removeCourse(course.courseId)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCourses.length >= 2 && (
              <div className="mt-4">
                <Button onClick={() => fetchComparisonData(selectedCourses)}>
                  Compare {selectedCourses.length} Courses
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
        {loading && <LoadingSpinner />}

        {!loading && comparisonData.length > 0 && (
          <div className="space-y-8">
            <ComparisonSection title="Basic Information">
              <Table>
                <TableBody>
                  <ComparisonRow label="Course">
                    {comparisonData.map((data, idx) => (
                      <TableCell key={idx} className="font-semibold text-text-primary">
                        {data.deptCode} {data.courseNumber}
                      </TableCell>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="Title">
                    {comparisonData.map((data, idx) => (
                      <TableCell key={idx} className="text-text-primary">{data.title}</TableCell>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="Units">
                    {comparisonData.map((data, idx) => (
                      <TableCell key={idx} className="text-text-primary">{data.units}</TableCell>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="Degree Level">
                    {comparisonData.map((data, idx) => (
                      <TableCell key={idx} className="text-text-primary">{data.degreeLevel}</TableCell>
                    ))}
                  </ComparisonRow>
                  {comparisonData.some((d) => d.designation) && (
                    <ComparisonRow label="Designation">
                      {comparisonData.map((data, idx) => (
                        <TableCell key={idx} className="text-text-primary">{data.designation || "—"}</TableCell>
                      ))}
                    </ComparisonRow>
                  )}
                </TableBody>
              </Table>
            </ComparisonSection>

            <ComparisonSection title="Course Description">
              <div className="grid md:grid-cols-3 gap-4">
                {comparisonData.map((data, idx) => (
                  <Card key={idx} className="p-4">
                    <p className={`${bodyStyles.md} text-text-muted`}>
                      {data.description || "No description available"}
                    </p>
                  </Card>
                ))}
              </div>
            </ComparisonSection>

            <ComparisonSection title="Requirements">
              <Table>
                <TableBody>
                  <ComparisonRow label="Prerequisites">
                    {comparisonData.map((data, idx) => (
                      <TableCell key={idx} className={`${bodyStyles.md} text-text-primary`}>
                        {data.prerequisites || "None"}
                      </TableCell>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="Corequisites">
                    {comparisonData.map((data, idx) => (
                      <TableCell key={idx} className={`${bodyStyles.md} text-text-primary`}>
                        {data.corequisites || "None"}
                      </TableCell>
                    ))}
                  </ComparisonRow>
                </TableBody>
              </Table>
            </ComparisonSection>

            <ComparisonSection title="Grade Statistics">
              <Table>
                <TableBody>
                  <ComparisonRow label="Median Grade">
                    {comparisonData.map((data, idx) => (
                      <TableCell key={idx} className={`${headerStyles.sm} text-text-primary`}>
                        {data.medianGrade || "N/A"}
                      </TableCell>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="Fail Rate">
                    {comparisonData.map((data, idx) => (
                      <TableCell key={idx} className="text-text-primary">
                        {data.failRate ? `${data.failRate.toFixed(2)}%` : "N/A"}
                      </TableCell>
                    ))}
                  </ComparisonRow>
                </TableBody>
              </Table>
            </ComparisonSection>

            {comparisonData.some((d) => d.gradeDistribution) && (
              <ComparisonSection title="Grade Distribution">
                <div className="grid md:grid-cols-3 gap-4">
                  {comparisonData.map((data, idx) => (
                    <Card key={idx} className="p-4">
                      <h4 className={`${labelStyles.lg} text-text-primary text-center mb-4`}>
                        {data.deptCode} {data.courseNumber}
                      </h4>
                      {data.gradeDistribution ? (
                        <GradeHistogram distribution={data.gradeDistribution} />
                      ) : (
                        <p className={`text-center ${bodyStyles.md} text-text-subtle py-8`}>No data available</p>
                      )}
                    </Card>
                  ))}
                </div>
              </ComparisonSection>
            )}

            <ComparisonSection title="View Full Details">
              <div className="grid md:grid-cols-3 gap-4">
                {selectedCourses.map((course, idx) => (
                  <Link
                    key={idx}
                    href={`/browse?dept=${course.deptId}&course=${course.courseId}`}
                    className="group"
                  >
                    <Card className="p-4 text-center hover:scale-105 transition-transform">
                      <p className={`${labelStyles.lg} text-text-primary mb-2`}>
                        {course.deptCode} {course.courseNumber}
                      </p>
                      <p className={`${bodyStyles.md} text-accent`}>View in Browse →</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </ComparisonSection>
          </div>
        )}

        {!loading && comparisonData.length === 0 && selectedCourses.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-surface-raised rounded-full flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-text-subtle" />
            </div>
            <h3 className={`${headerStyles.md} text-text-primary mb-2`}>No Courses Selected</h3>
            <p className={`${bodyStyles.md} text-text-muted`}>Select 2-3 courses above to start comparing</p>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

function ComparisonSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <h2 className={`${headerStyles.lg} text-text-primary mb-4`}>{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

function ComparisonRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TableRow className="border-b border-border">
      <TableCell className={`font-medium text-text-muted w-1/4 ${bodyStyles.md}`}>{label}</TableCell>
      {children}
    </TableRow>
  );
}

export default function CourseComparison() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CourseComparisonContent />
    </Suspense>
  );
}
