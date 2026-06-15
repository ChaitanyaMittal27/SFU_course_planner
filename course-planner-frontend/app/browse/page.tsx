"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import GradeHistogram from "@/components/GradeHistogram";
import { useQueryState } from "nuqs";
import { api } from "@/lib/api";
import type { Course, CourseOffering, Department, OfferingDetail } from "@/lib/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import BookmarkButton from "@/components/BookmarkButton";
import BackButton from "@/components/BackButton";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const selectClass =
  "w-full rounded-md border border-border bg-background text-text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

function sortAlphaNum(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function formatSemesterLabel(o: CourseOffering) {
  return `${o.term} ${o.year}`;
}

function extractSection(section: string) {
  const parts = section.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

function OfferingDetailScreen({ detail, onBack }: { detail: OfferingDetail; onBack: () => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BackButton onClick={onBack} label="Back to offerings" className="mb-6" />

      <Card className="p-6 rounded-2xl">
        <div className="flex flex-col gap-1">
          <div className={`${bodyStyles.md} text-text-muted`}>
            {detail.deptCode.toUpperCase()} {detail.courseNumber}
          </div>
          <div className={`${headerStyles.lg} text-text-primary`}>{detail.title}</div>
          <div className={`${bodyStyles.md} text-text-muted`}>
            {detail.term} {detail.year}
            {detail.campus ? ` • ${detail.campus}` : ""}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Units", value: detail.units },
            { label: "Median Grade", value: detail.medianGrade ?? "N/A" },
            {
              label: "Fail Rate",
              value: Number.isFinite(detail.failRate) ? `${detail.failRate.toFixed(2)}%` : "N/A",
            },
          ].map(({ label, value }) => (
            <div key={label} className="border rounded-xl p-4 border-border/50">
              <div className={`${bodyStyles.sm} text-text-subtle`}>{label}</div>
              <div className={`${headerStyles.md} text-text-primary`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {detail.degreeLevel && (
            <span className="inline-flex items-center px-3 py-2 rounded-lg bg-surface-raised text-text-primary text-sm">
              {detail.degreeLevel}
            </span>
          )}
          {detail.designation && (
            <span className="inline-flex items-center px-3 py-2 rounded-lg bg-surface-raised text-text-primary text-sm">
              {detail.designation}
            </span>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {detail.description && (
            <div>
              <div className={`${labelStyles.lg} text-text-primary mb-1`}>Description</div>
              <p className={`${bodyStyles.md} text-text-muted leading-relaxed`}>{detail.description}</p>
            </div>
          )}

          {(detail.prerequisites || detail.corequisites) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-xl p-4 border-border/50">
                <div className={`${labelStyles.lg} text-text-primary mb-1`}>Prerequisites</div>
                <p className={`${bodyStyles.md} text-text-muted`}>{detail.prerequisites ?? "None"}</p>
              </div>
              <div className="border rounded-xl p-4 border-border/50">
                <div className={`${labelStyles.lg} text-text-primary mb-1`}>Corequisites</div>
                <p className={`${bodyStyles.md} text-text-muted`}>{detail.corequisites ?? "None"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sections table */}
        <div className="mt-8">
          <div className={`${headerStyles.md} text-text-primary mb-3`}>Sections</div>
          {detail.sections.length === 0 ? (
            <div className={`${bodyStyles.md} text-text-muted`}>No section data found.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Load</TableHead>
                    <TableHead>Jump to Outline</TableHead>
                    <TableHead className="text-center">Bookmark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.sections.map((s) => (
                    <TableRow key={s.section} className="cursor-default">
                      <TableCell>{s.section}</TableCell>
                      <TableCell>{s.instructors || "—"}</TableCell>
                      <TableCell>{s.location || "—"}</TableCell>
                      <TableCell>{s.enrolled}</TableCell>
                      <TableCell>{s.capacity}</TableCell>
                      <TableCell>{s.loadPercent ?? 0}%</TableCell>
                      <TableCell>
                        <a
                          href={`https://www.sfu.ca/outlines.html?${
                            detail.year
                          }/${detail.term.toLowerCase()}/${detail.deptCode.toLowerCase()}/${detail.courseNumber.toLowerCase()}/${extractSection(
                            s.section
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline"
                        >
                          Open outline
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <BookmarkButton
                          deptId={detail.deptId}
                          courseId={detail.courseId}
                          semesterCode={s.semesterCode}
                          section={s.section}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {detail.gradeDistribution && (
          <div className="mt-8">
            <div className={`${headerStyles.md} text-text-primary mb-3`}>Grade Distribution</div>
            <GradeHistogram distribution={detail.gradeDistribution} />
            <p className={`mt-2 ${bodyStyles.sm} text-text-subtle`}>
              Based on Coursediggers data. For more information refer to{" "}
              <a
                href="https://coursediggers.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Coursediggers
              </a>
              .
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function BrowsePageContent() {
  const [deptId, setDeptId] = useQueryState("dept");
  const [courseId, setCourseId] = useQueryState("course");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [offeringDetail, setOfferingDetail] = useState<OfferingDetail | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ dept: Department; course: Course }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [courseCache, setCourseCache] = useState<Record<number, Course[]>>({});

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

  useEffect(() => {
    (async () => {
      try {
        setLoadingDepartments(true);
        const data = await api.getDepartments();
        const sorted = [...data].sort((a, b) => sortAlphaNum(a.deptCode ?? a.name, b.deptCode ?? b.name));
        setDepartments(sorted);
      } catch {
        setError("Failed to load departments.");
      } finally {
        setLoadingDepartments(false);
      }
    })();
  }, []);

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

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const match = q.toUpperCase().match(/^([A-Z]{2,5})\s*([0-9]{2,4}[A-Z]?)$/);
    if (!match) {
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

  const mainGridRef = useScrollReveal();

  if (offeringDetail) {
    return <OfferingDetailScreen detail={offeringDetail} onBack={() => setOfferingDetail(null)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary`}>Browse Courses</h1>
        <p className={`${bodyStyles.md} text-text-muted mt-1`}>
          Pick a Department → Course → Click to view enrollments by term offering.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search like: CMPT 213"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-subtle" />

          {showSearchResults && (
            <div className="absolute z-10 w-full mt-2 bg-surface-raised border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map(({ dept, course }) => (
                  <button
                    key={`${dept.deptId}-${course.courseId}`}
                    onClick={() => selectFromSearch(dept, course)}
                    className="w-full text-left px-4 py-3 hover:bg-surface transition-colors border-b border-border last:border-b-0"
                  >
                    <div className={`${labelStyles.lg} text-text-primary`}>
                      {dept.deptCode} {course.courseNumber}
                    </div>
                    <div className={`${bodyStyles.md} text-text-subtle`}>{dept.name}</div>
                  </button>
                ))
              ) : (
                <div className={`p-4 ${bodyStyles.md} text-text-muted`}>
                  No matches. Use format like <span className="font-semibold">CMPT 213</span>.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={() => setError(null)} />
        </div>
      )}

      {/* Main Grid */}
      <div ref={mainGridRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT */}
        <aside className="lg:col-span-3">
          <Card className="p-5 rounded-2xl sticky top-24">
            <div className={`${headerStyles.md} text-text-primary mb-3`}>Department</div>

            <select
              title="select_dept"
              className={selectClass}
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
              <div className={`${headerStyles.md} text-text-primary mb-2`}>
                {selectedDept ? `${selectedDept.deptCode.toUpperCase()} Courses` : "Courses"}
              </div>

              {loadingCourses && <div className={`${bodyStyles.md} text-text-muted`}>Loading courses…</div>}

              {!loadingCourses && selectedDept && courses.length === 0 && (
                <div className={`${bodyStyles.md} text-text-muted`}>No courses found.</div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-2">
                {courses.map((c) => {
                  const active = selectedCourse?.courseId === c.courseId;
                  return (
                    <button
                      key={c.courseId}
                      onClick={() => setCourseId(String(c.courseId))}
                      className={[
                        "px-3 py-2 rounded-lg text-sm font-medium transition",
                        active
                          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                          : "bg-accent/5 text-text-primary hover:bg-accent/10",
                      ].join(" ")}
                    >
                      {c.courseNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </aside>

        {/* CENTER */}
        <section className="lg:col-span-9">
          <Card className="p-5 rounded-2xl">
            {!selectedCourse ? (
              <>
                <div className={`${headerStyles.md} text-text-primary`}>Course Offerings</div>
                <p className={`${bodyStyles.md} text-text-muted mt-2`}>
                  Select a department and course to view: enrolling term first, then previous terms.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className={`${headerStyles.md} text-text-primary`}>
                      {selectedDept?.name} {selectedCourse.courseNumber}
                    </div>
                    <div className={`${bodyStyles.md} text-text-muted`}>
                      Click a term row to open full details.
                    </div>
                  </div>
                </div>

                {loadingOfferings && <LoadingSpinner />}

                {!loadingOfferings && offerings.length === 0 && (
                  <div className={`${bodyStyles.md} text-text-muted`}>No offerings found.</div>
                )}

                {offerings.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Term</TableHead>
                          <TableHead>Section</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Campus</TableHead>
                          <TableHead>Enrolled / Cap</TableHead>
                          <TableHead>Load</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offerings.map((o, idx) => {
                          const active = selectedOffering?.semesterCode === o.semesterCode;
                          const baseRowBg = idx % 2 === 0 ? "bg-background" : "bg-accent/5";
                          const enrollingTint = o.isEnrolling ? "bg-success/5" : "";
                          const bgClass = active ? "bg-accent/10" : enrollingTint || baseRowBg;

                          return (
                            <TableRow
                              key={`${o.semesterCode}-${o.section}`}
                              onClick={() => openOfferingDetail(o)}
                              className={`cursor-pointer transition ${bgClass}`}
                            >
                              <TableCell>
                                {formatSemesterLabel(o)}
                                {o.isEnrolling && (
                                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full ${labelStyles.sm} bg-success/10 text-success`}>
                                    Enrolling
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{o.section}</TableCell>
                              <TableCell>{o.instructors || "—"}</TableCell>
                              <TableCell>{o.location || "—"}</TableCell>
                              <TableCell>
                                {o.enrolled} / {o.capacity}
                              </TableCell>
                              <TableCell>{o.loadPercent ?? 0}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {loadingDetail && (
                  <div className="mt-4">
                    <LoadingSpinner />
                  </div>
                )}
              </>
            )}
          </Card>
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
