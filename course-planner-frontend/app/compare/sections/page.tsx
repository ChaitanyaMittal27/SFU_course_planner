"use client";

import { useState, useEffect, Suspense } from "react";
import { useQueryState } from "nuqs";
import { ClipboardList } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { api, Department, Course, OfferingDetail, CourseOffering } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

const selectClass =
  "w-full rounded-md border border-border bg-background text-text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

function SectionComparisonContent() {
  const [deptIdParam, setDeptIdParam] = useQueryState("deptId");
  const [courseIdParam, setCourseIdParam] = useQueryState("courseId");
  const [semesterParam, setSemesterParam] = useQueryState("semester");
  const [sectionsParam, setSectionsParam] = useQueryState("sections");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<{ code: number; label: string }[]>([]);

  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const [offeringData, setOfferingData] = useState<OfferingDetail | null>(null);
  const [availableSections, setAvailableSections] = useState<CourseOffering[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
    generateSemesters();
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

  const generateSemesters = async () => {
    try {
      const enrolling = await api.getEnrollingTerm();
      const sems: { code: number; label: string }[] = [];
      let year = enrolling.year;
      let term = enrolling.term;

      for (let i = 0; i < 9; i++) {
        const termCode = term === "spring" ? 1 : term === "summer" ? 4 : 7;
        const code = (year - 1900) * 10 + termCode;
        const label = `${term.charAt(0).toUpperCase() + term.slice(1)} ${year}`;
        sems.push({ code, label });
        const prev = getPreviousSemester(year, term);
        year = prev.year;
        term = prev.term;
      }

      setSemesters(sems);
      setSelectedSemester(enrolling.semesterCode);
    } catch (err) {
      setError("Failed to load semesters");
    }
  };

  const loadFromURL = async () => {
    if (deptIdParam && courseIdParam && semesterParam) {
      const deptId = Number(deptIdParam);
      const courseId = Number(courseIdParam);
      const semester = Number(semesterParam);

      setSelectedDept(deptId);
      setSelectedCourse(courseId);
      setSelectedSemester(semester);

      if (sectionsParam) setSelectedSections(sectionsParam.split(","));
      await fetchOfferingData(deptId, courseId, semester);
    }
  };

  const updateURL = () => {
    setDeptIdParam(selectedDept?.toString() || null);
    setCourseIdParam(selectedCourse?.toString() || null);
    setSemesterParam(selectedSemester?.toString() || null);
    setSectionsParam(selectedSections.length > 0 ? selectedSections.join(",") : null);
  };

  useEffect(() => {
    updateURL();
  }, [selectedDept, selectedCourse, selectedSemester, selectedSections]);

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

  const fetchOfferingData = async (deptId: number, courseId: number, semesterCode: number) => {
    if (!deptId || !courseId || !semesterCode) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOfferingDetail(deptId, courseId, semesterCode);
      setOfferingData(data);
      setAvailableSections(data.sections);
      setSelectedSections([]);
    } catch (err) {
      setError("Failed to fetch offering data. This course may not be offered in the selected semester.");
      setOfferingData(null);
      setAvailableSections([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setSelectedSections((prev) => {
      if (prev.includes(section)) return prev.filter((s) => s !== section);
      if (prev.length >= 3) {
        setError("Maximum 3 sections allowed");
        return prev;
      }
      return [...prev, section];
    });
    setError(null);
  };

  const comparisonSections = availableSections.filter((s) => selectedSections.includes(s.section));

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${displayStyles.sm} text-text-primary mb-2`}>Compare Sections</h1>
          <p className={`${bodyStyles.md} text-text-muted`}>
            Select a course and semester, then compare different sections to find the best fit.
          </p>
        </div>

        {/* Selection Panel */}
        <Card className="p-6 mb-8">
          <CardContent className="p-0">
            <h2 className={`${headerStyles.md} text-text-primary mb-4`}>Select Course & Semester</h2>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={`block ${labelStyles.md} text-text-primary mb-2`}>Department</label>
                <select
                  title="dept"
                  value={selectedDept || ""}
                  onChange={(e) => {
                    setSelectedDept(Number(e.target.value));
                    setSelectedCourse(null);
                    setOfferingData(null);
                  }}
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
                  onChange={(e) => {
                    setSelectedCourse(Number(e.target.value));
                    setOfferingData(null);
                  }}
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

              <div>
                <label className={`block ${labelStyles.md} text-text-primary mb-2`}>Semester</label>
                <select
                  title="sem"
                  value={selectedSemester || ""}
                  onChange={(e) => setSelectedSemester(Number(e.target.value))}
                  className={selectClass}
                  disabled={!selectedCourse}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem.code} value={sem.code}>
                      {sem.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedDept && selectedCourse && selectedSemester && !offeringData && (
              <Button onClick={() => fetchOfferingData(selectedDept, selectedCourse, selectedSemester)}>
                Load Sections
              </Button>
            )}
          </CardContent>
        </Card>

        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
        {loading && <LoadingSpinner />}

        {!loading && offeringData && availableSections.length > 0 && (
          <Card className="p-6 mb-8">
            <CardContent className="p-0">
              <h2 className={`${headerStyles.md} text-text-primary mb-2`}>
                Available Sections ({availableSections.length})
              </h2>
              <p className={`${bodyStyles.md} text-text-muted mb-4`}>
                Select 2-3 sections to compare. Selected: {selectedSections.length}/3
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableSections.map((section) => (
                  <button
                    key={section.section}
                    onClick={() => toggleSection(section.section)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedSections.includes(section.section)
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className={`${labelStyles.lg} text-text-primary mb-1`}>{section.section}</div>
                    <div className={`${bodyStyles.md} text-text-muted`}>{section.instructors}</div>
                    <div className={`${bodyStyles.sm} text-text-subtle mt-2`}>
                      {section.enrolled}/{section.capacity} • {section.loadPercent}% full
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && comparisonSections.length >= 2 && (
          <Card className="p-6">
            <CardContent className="p-0">
              <h2 className={`${headerStyles.lg} text-text-primary mb-6`}>Section Comparison</h2>

              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    <ComparisonRow label="Section">
                      {comparisonSections.map((s, idx) => (
                        <TableCell key={idx} className={`${headerStyles.sm} text-text-primary`}>
                          {s.section}
                        </TableCell>
                      ))}
                    </ComparisonRow>

                    <ComparisonRow label="Instructor">
                      {comparisonSections.map((s, idx) => (
                        <TableCell key={idx} className="text-text-primary">{s.instructors}</TableCell>
                      ))}
                    </ComparisonRow>

                    <ComparisonRow label="Campus">
                      {comparisonSections.map((s, idx) => (
                        <TableCell key={idx} className="text-text-primary">{s.location}</TableCell>
                      ))}
                    </ComparisonRow>

                    <ComparisonRow label="Enrollment">
                      {comparisonSections.map((s, idx) => (
                        <TableCell key={idx} className="text-text-primary">
                          {s.enrolled} / {s.capacity}
                        </TableCell>
                      ))}
                    </ComparisonRow>

                    <ComparisonRow label="Capacity Used">
                      {comparisonSections.map((s, idx) => (
                        <TableCell key={idx}>
                          <div className="flex items-center gap-2">
                            <div className="flex-grow bg-surface-raised rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                                style={{ width: `${Math.min(s.loadPercent, 100)}%` }}
                              />
                            </div>
                            <span className={`${labelStyles.md} text-text-primary`}>{s.loadPercent}%</span>
                          </div>
                        </TableCell>
                      ))}
                    </ComparisonRow>

                    <ComparisonRow label="CourseSys Link">
                      {comparisonSections.map((s, idx) => (
                        <TableCell key={idx}>
                          <a
                            href={`https://coursys.sfu.ca${s.infoUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-accent hover:underline ${bodyStyles.md}`}
                          >
                            View Details →
                          </a>
                        </TableCell>
                      ))}
                    </ComparisonRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !offeringData && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-surface-raised rounded-full flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-text-subtle" />
            </div>
            <h3 className={`${headerStyles.md} text-text-primary mb-2`}>No Sections Loaded</h3>
            <p className={`${bodyStyles.md} text-text-muted`}>
              Select a course and semester above to view available sections
            </p>
          </Card>
        )}

        {!loading && offeringData && availableSections.length > 0 && selectedSections.length < 2 && (
          <Card className="p-8 text-center">
            <h3 className={`${headerStyles.sm} text-text-primary mb-2`}>Select Sections to Compare</h3>
            <p className={`${bodyStyles.md} text-text-muted`}>Choose at least 2 sections from the list above</p>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

function ComparisonRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TableRow className="border-b border-border">
      <TableCell className={`font-medium text-text-muted w-1/5 ${bodyStyles.md}`}>{label}</TableCell>
      {children}
    </TableRow>
  );
}

function getPreviousSemester(year: number, term: string): { year: number; term: string } {
  if (term === "spring") return { year: year - 1, term: "fall" };
  if (term === "summer") return { year, term: "spring" };
  return { year, term: "summer" };
}

export default function SectionComparisonPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SectionComparisonContent />
    </Suspense>
  );
}
