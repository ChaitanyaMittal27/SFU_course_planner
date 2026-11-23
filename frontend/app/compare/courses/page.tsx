"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { ClipboardList, X } from "lucide-react";
import CompareHeader from "@/components/compare/CompareHeader";
import ComparisonTable, { type ComparisonRowData } from "@/components/compare/ComparisonTable";
import SectionCard from "@/components/course/SectionCard";
import LoadBar from "@/components/enrollment/LoadBar";
import GradeHistogram from "@/components/analytics/GradeHistogram";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { TableRowsSkeleton } from "@/components/feedback/Skeletons";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import { api } from "@/lib/api";
import { buildCourseComparison, type CompareCourseInput } from "@/lib/compare-courses";
import { courseHref, parseComparedCourses, serializeComparedCourses } from "@/lib/course-routes";
import { resolveCourseIdentity, resolveCourseIds, type ResolvedCourseRoute } from "@/lib/course-resolver";
import { formatCourseCode, formatPercent } from "@/lib/course-stats";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import { cn } from "@/lib/utils";
import type { Course, Department, TermInfo } from "@/lib/types";

const MAX_COMPARED_COURSES = 3;

const best = "font-semibold text-success-text";

function sortByNumber(a: Course, b: Course) {
  return a.courseNumber.localeCompare(b.courseNumber, undefined, { numeric: true });
}

/** Resolves a ?courses= value: readable "cmpt-225,math-232" or legacy "14:3998,…" id pairs. */
async function resolveCoursesParam(param: string): Promise<ResolvedCourseRoute[]> {
  const readable = parseComparedCourses(param);
  const resolved = readable.length > 0
    ? await Promise.all(readable.map(resolveCourseIdentity))
    : await Promise.all(param.split(",").map((pair) => {
        const [deptId, courseId] = pair.split(":").map(Number);
        return resolveCourseIds(deptId, courseId);
      }));
  if (resolved.some((course) => course === null) || resolved.length > MAX_COMPARED_COURSES) {
    throw new Error("Invalid comparison link");
  }
  return resolved as ResolvedCourseRoute[];
}

function CourseComparisonContent() {
  const [coursesParam, setCoursesParam] = useQueryState("courses");

  // Picked courses; kept in step with ?courses= (the shareable source of truth).
  const [selected, setSelected] = useState<ResolvedCourseRoute[]>([]);
  const [linkError, setLinkError] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  // Picker data.
  const departmentsRequest = useRetryableRequest();
  const [departmentsResult, setDepartmentsResult] = useState<{ attempt: number; data: Department[] | null } | null>(null);
  const [deptId, setDeptId] = useState("");
  const [courseId, setCourseId] = useState("");
  const coursesRequest = useRetryableRequest();
  const [coursesResult, setCoursesResult] = useState<{ key: string; data: Course[] | null } | null>(null);

  // Comparison data for the picked courses.
  const comparisonRequest = useRetryableRequest();
  const [comparison, setComparison] = useState<{ key: string; inputs: CompareCourseInput[] | null; term: TermInfo | null } | null>(null);

  const departments = departmentsResult?.data ?? [];
  const departmentsFailed = departmentsResult?.attempt === departmentsRequest.requestVersion && departmentsResult.data === null;
  const coursesKey = deptId ? `${deptId}#${coursesRequest.requestVersion}` : "";
  const courses = coursesResult?.key === coursesKey ? coursesResult.data : null;
  const coursesFailed = Boolean(deptId) && coursesResult?.key === coursesKey && coursesResult.data === null;

  useEffect(() => {
    let active = true;
    const attempt = departmentsRequest.requestVersion;
    api
      .getDepartments()
      .then((data) => active && setDepartmentsResult({ attempt, data: [...data].sort((a, b) => a.deptCode.localeCompare(b.deptCode)) }))
      .catch(() => active && setDepartmentsResult({ attempt, data: null }));
    return () => {
      active = false;
    };
  }, [departmentsRequest.requestVersion]);

  useEffect(() => {
    if (!deptId) return;
    let active = true;
    const key = coursesKey;
    api
      .getCourses(Number(deptId))
      .then((data) => active && setCoursesResult({ key, data: [...data].sort(sortByNumber) }))
      .catch(() => active && setCoursesResult({ key, data: null }));
    return () => {
      active = false;
    };
  }, [deptId, coursesKey]);

  // Follow ?courses= when it changes from outside (shared links, back/forward).
  useEffect(() => {
    const current = serializeComparedCourses(selected);
    if ((coursesParam ?? "") === current) return;
    let active = true;
    const param = coursesParam ?? "";
    (param ? resolveCoursesParam(param) : Promise.resolve([]))
      .then((resolved) => {
        if (!active) return;
        setLinkError(false);
        setSelected(resolved);
        const readable = serializeComparedCourses(resolved);
        if (param && readable !== param) void setCoursesParam(readable);
      })
      .catch(() => active && setLinkError(true));
    return () => {
      active = false;
    };
    // `selected` is deliberately not a dependency: local edits update the URL themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coursesParam]);

  const comparisonKey = selected.length >= 2 ? `${selected.map((c) => c.courseId).join(",")}#${comparisonRequest.requestVersion}` : "";

  useEffect(() => {
    if (!comparisonKey) return;
    let active = true;
    const key = comparisonKey;
    const courses = selected;
    Promise.all([
      api.getEnrollingTerm().catch(() => null),
      Promise.all(
        courses.map(async (course): Promise<CompareCourseInput> => {
          const [offerings, grades] = await Promise.all([
            api.getOfferings(course.deptId, course.courseId),
            api.getGradeDistribution(course.courseId).catch(() => null),
          ]);
          return { deptCode: course.department.deptCode, course: course.course, grades, offerings };
        }),
      ),
    ])
      .then(([term, inputs]) => active && setComparison({ key, inputs, term }))
      .catch(() => active && setComparison({ key, inputs: null, term: null }));
    return () => {
      active = false;
    };
    // `selected` is captured through comparisonKey (its course IDs).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisonKey]);

  const updateSelection = (next: ResolvedCourseRoute[]) => {
    setSelected(next);
    void setCoursesParam(next.length > 0 ? serializeComparedCourses(next) : null);
  };

  const addCourse = () => {
    const department = departments.find((d) => d.deptId === Number(deptId));
    const course = courses?.find((c) => c.courseId === Number(courseId));
    if (!department || !course) return;
    const code = formatCourseCode(department.deptCode, course.courseNumber);
    if (selected.some((c) => c.courseId === course.courseId)) {
      setValidation(`${code} is already in the comparison.`);
      return;
    }
    if (selected.length >= MAX_COMPARED_COURSES) {
      setValidation(`You can compare up to ${MAX_COMPARED_COURSES} courses. Remove one to add ${code}.`);
      return;
    }
    setValidation(null);
    setCourseId("");
    updateSelection([
      ...selected,
      {
        deptId: department.deptId,
        courseId: course.courseId,
        deptCode: department.deptCode.toLowerCase(),
        courseNumber: course.courseNumber.toLowerCase(),
        department,
        course,
      },
    ]);
  };

  const removeCourse = (id: number) => {
    setValidation(null);
    updateSelection(selected.filter((c) => c.courseId !== id));
  };

  const settled = comparison?.key === comparisonKey ? comparison : null;
  const result = useMemo(
    () => (settled?.inputs ? buildCourseComparison(settled.inputs, settled.term) : null),
    [settled],
  );

  return (
    <PageContainer>
      <CompareHeader tab="courses" />

      {departmentsFailed && (
        <ErrorMessage className="mb-6" title="Couldn't load departments" message="The department list didn't load." onRetry={departmentsRequest.retry} />
      )}
      {coursesFailed && (
        <ErrorMessage className="mb-6" title="Couldn't load courses" message="Courses for this department didn't load." onRetry={coursesRequest.retry} />
      )}
      {linkError && <ErrorMessage className="mb-6" title="Invalid comparison link" message="Some courses in this link couldn't be found." />}

      <form
        className="grid max-w-3xl gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          addCourse();
        }}
      >
        <div>
          <label htmlFor="compare-course-department" className={cn(labelStyles.lg, "mb-2 block text-text-primary")}>
            Department
          </label>
          <NativeSelect
            id="compare-course-department"
            className="w-full"
            value={deptId}
            disabled={departments.length === 0}
            onChange={(event) => {
              setDeptId(event.target.value);
              setCourseId("");
              setValidation(null);
            }}
          >
            <NativeSelectOption value="">Select a department</NativeSelectOption>
            {departments.map((d) => (
              <NativeSelectOption key={d.deptId} value={d.deptId}>
                {d.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="compare-course-course" className={cn(labelStyles.lg, "mb-2 block text-text-primary")}>
            Course
          </label>
          <NativeSelect
            id="compare-course-course"
            className="w-full"
            value={courseId}
            disabled={!courses}
            onChange={(event) => {
              setCourseId(event.target.value);
              setValidation(null);
            }}
          >
            <NativeSelectOption value="">{!deptId ? "Select a department first" : !courses ? "Loading courses…" : "Select a course"}</NativeSelectOption>
            {(courses ?? []).map((c) => (
              <NativeSelectOption key={c.courseId} value={c.courseId}>
                {c.courseNumber} · {c.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" disabled={!courseId}>
          Add
        </Button>
      </form>

      <p role="status" className={cn(bodyStyles.sm, "mt-2 min-h-5 text-warning-text")}>
        {validation}
      </p>

      {selected.length > 0 && (
        <ul aria-label="Courses to compare" className="mt-2 mb-8 flex flex-wrap gap-2">
          {selected.map((course) => {
            const code = formatCourseCode(course.deptCode, course.courseNumber);
            return (
              <li key={course.courseId}>
                <button
                  type="button"
                  aria-label={`Remove ${code}`}
                  onClick={() => removeCourse(course.courseId)}
                  className={cn(
                    labelStyles.lg,
                    "inline-flex h-8 items-center gap-1.5 rounded-md bg-surface-raised px-3 text-text-primary transition-colors hover:bg-border focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  )}
                >
                  <span className={numericStyles.base}>{code}</span>
                  <X aria-hidden="true" className="size-3.5 text-text-muted" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {selected.length === 0 && <div className="mb-8" />}

      {selected.length < 2 && !linkError && !departmentsFailed && !coursesFailed && (
        <TaskEmptyState
          headingLevel={2}
          icon={ClipboardList}
          title="Add at least two courses to compare them."
          description="Pick a department and course above, then add it. You can compare up to three."
        />
      )}

      {selected.length >= 2 && !settled && (
        <SectionCard title="Comparison" flush>
          <TableRowsSkeleton rows={6} columns={selected.length + 1} label="Loading comparison" className="p-4 sm:p-5" />
        </SectionCard>
      )}

      {selected.length >= 2 && settled && !result && (
        <ErrorMessage title="Couldn't load the comparison" message="Course data didn't load." onRetry={comparisonRequest.retry} />
      )}

      {result && (
        <div className="space-y-6">
          <SectionCard title="Comparison" note="Best value in each row in green" flush>
            <ComparisonTable
              columns={result.columns.map((column) => ({
                key: `${column.deptCode}-${column.courseNumber}`,
                mobileLabel: formatCourseCode(column.deptCode, column.courseNumber),
                header: (
                  <>
                    <Link
                      href={courseHref(column.deptCode, column.courseNumber)}
                      className={cn(numericStyles.md, "font-semibold text-text-primary underline-offset-4 hover:underline")}
                    >
                      {column.deptCode} {column.courseNumber}
                    </Link>
                    {column.title && <span className={cn(bodyStyles.sm, "block font-normal text-text-muted")}>{column.title}</span>}
                  </>
                ),
              }))}
              rows={comparisonRows(result)}
            />
          </SectionCard>

          <SectionCard title="Grade distributions" note="All terms · CourseDiggers" flush>
            <div className={cn("grid grid-cols-1 divide-y divide-border md:divide-x md:divide-y-0", result.columns.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
              {result.columns.map((column) => (
                <div key={`${column.deptCode}-${column.courseNumber}`} className="p-4 sm:p-5">
                  <p className={cn(labelStyles.lg, "mb-3 flex items-baseline justify-between gap-2 text-text-primary")}>
                    <span className={numericStyles.base}>
                      {column.deptCode} {column.courseNumber}
                    </span>
                    {column.medianGrade && <span className="text-text-muted">Median {column.medianGrade}</span>}
                  </p>
                  {column.distribution ? (
                    <GradeHistogram distribution={column.distribution} medianGrade={column.medianGrade} showSummary={false} size="sm" />
                  ) : (
                    <p className={cn(bodyStyles.md, "py-8 text-center text-text-subtle")}>No grade data.</p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </PageContainer>
  );
}

function comparisonRows({ columns, best: winners }: ReturnType<typeof buildCourseComparison>): ComparisonRowData[] {
  const mark = (rowBest: number | null, index: number) => (rowBest === index ? best : undefined);
  const rows: ComparisonRowData[] = [
    {
      label: "Median grade",
      cells: columns.map((c, i) => <span key={i} className={cn(numericStyles.md, mark(winners.medianGrade, i))}>{c.medianGrade ?? "—"}</span>),
    },
    {
      label: "Fail rate",
      cells: columns.map((c, i) => <span key={i} className={cn(numericStyles.md, mark(winners.failRate, i))}>{formatPercent(c.failRate) ?? "—"}</span>),
    },
    {
      label: "Avg. load, last 3 terms",
      cells: columns.map((c, i) =>
        c.avgLoad === null ? "—" : <LoadBar key={i} percent={c.avgLoad} labelClassName={mark(winners.avgLoad, i)} />,
      ),
    },
    { label: "Units", cells: columns.map((c, i) => <span key={i} className={numericStyles.md}>{c.units ?? "—"}</span>) },
    { label: "Campuses", cells: columns.map((c) => (c.campuses.length > 0 ? c.campuses.join(", ") : "—")) },
  ];
  if (columns.every((c) => c.offered !== null)) {
    rows.push({
      label: "Offered",
      cells: columns.map((c) => `${c.offered!.offered} of last ${c.offered!.total} terms`),
    });
  }
  rows.push({ label: "Prerequisites", cells: columns.map((c, i) => <span key={i} className="text-text-muted">{c.prerequisites || "None listed"}</span>) });
  return rows;
}

export default function CourseComparison() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CourseComparisonContent />
    </Suspense>
  );
}
