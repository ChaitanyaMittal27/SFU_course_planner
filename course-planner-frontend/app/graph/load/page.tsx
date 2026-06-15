"use client";

import { useState, useEffect, Suspense } from "react";
import { useQueryState } from "nuqs";
import { TrendingUp, Info, BarChart2 } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { api, Department, Course, EnrollmentDataPoint } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const selectClass =
  "w-full rounded-md border border-border bg-background text-text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

function LoadOverTimePageContent() {
  const [selectedDeptId, setSelectedDeptId] = useQueryState("deptId");
  const [selectedCourseId, setSelectedCourseId] = useQueryState("courseId");
  const [range, setRange] = useQueryState("range", { defaultValue: "5yr" });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chartData, setChartData] = useState<EnrollmentDataPoint[]>([]);

  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
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

  const selectedDept = departments.find((d) => d.deptId === parseInt(selectedDeptId || "0"));
  const selectedCourse = courses.find((c) => c.courseId === parseInt(selectedCourseId || "0"));

  const formatSemester = (semesterCode: number) => {
    const year = Math.floor(semesterCode / 10) - 100;
    const termCode = semesterCode % 10;
    const term = termCode === 1 ? "Sp" : termCode === 4 ? "Su" : "Fa";
    return `${term} ${year}`;
  };

  const getLoadColor = (load: number) => {
    if (load < 80) return "var(--success)";
    if (load < 95) return "var(--warning)";
    return "var(--destructive)";
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <circle cx={cx} cy={cy} r={5} fill={getLoadColor(payload.loadPercent)} stroke="var(--background)" strokeWidth={2} />
    );
  };

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
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className={`${displayStyles.sm} text-text-primary`}>Load Over Time</h1>
            <p className={`${bodyStyles.md} text-text-muted mt-1`}>Track enrollment percentage across semesters</p>
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
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-accent/5 rounded-lg border border-accent/20 flex items-center space-x-2">
                <Info className="w-5 h-5 text-accent shrink-0" />
                <span className={`${labelStyles.lg} text-text-primary`}>
                  {selectedDept.name} {selectedCourse.courseNumber} — {selectedCourse.title}
                </span>
              </div>

              <div>
                <label className={`block ${labelStyles.md} text-text-primary mb-2`}>Time Range</label>
                <div className="flex space-x-2">
                  {["1yr", "3yr", "5yr"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        range === r
                          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                          : "bg-surface-raised text-text-muted hover:bg-border"
                      }`}
                    >
                      {r === "1yr" ? "1 Year" : r === "3yr" ? "3 Years" : "5 Years"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}

      {loadingChart && (
        <Card className="p-8">
          <LoadingSpinner />
        </Card>
      )}

      {!loadingChart && !error && chartData.length > 0 && (
        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`${headerStyles.md} text-text-primary`}>Enrollment Load (%)</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className={`${bodyStyles.md} text-text-muted`}>&lt; 80%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className={`${bodyStyles.md} text-text-muted`}>80-95%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className={`${bodyStyles.md} text-text-muted`}>&gt; 95%</span>
                </div>
              </div>
            </div>

            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis
                    dataKey="semesterCode"
                    tickFormatter={formatSemester}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="var(--text-muted)"
                    tick={{ fill: "var(--text-muted)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    label={{ value: "Load %", angle: -90, position: "insideLeft", fill: "var(--text-muted)" }}
                    stroke="var(--text-muted)"
                    tick={{ fill: "var(--text-muted)" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div
                            style={{
                              background: "var(--surface-raised)",
                              border: "1px solid var(--border)",
                              color: "var(--text-primary)",
                            }}
                            className="p-3 rounded-lg shadow-lg"
                          >
                            <p className="font-semibold">
                              {d.term} {d.year}
                            </p>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                              Enrolled: {d.enrolled} / {d.capacity}
                            </p>
                            <p style={{ color: getLoadColor(d.loadPercent) }} className={labelStyles.md}>
                              Load: {d.loadPercent.toFixed(1)}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={80} stroke="var(--warning)" strokeDasharray="3 3" opacity={0.5} />
                  <ReferenceLine y={95} stroke="var(--destructive)" strokeDasharray="3 3" opacity={0.5} />
                  <Line
                    type="monotone"
                    dataKey="loadPercent"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={<CustomDot />}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {!loadingChart && !error && chartData.length === 0 && selectedCourseId && (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-10 h-10 text-text-subtle" />
          </div>
          <h3 className={`${headerStyles.md} text-text-primary mb-2`}>No Data Available</h3>
          <p className={`${bodyStyles.md} text-text-muted`}>
            No enrollment data found for this course in the selected time range.
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
            Select a department and course above to view load over time
          </p>
        </Card>
      )}
    </PageContainer>
  );
}

export default function LoadOverTimePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoadOverTimePageContent />
    </Suspense>
  );
}
