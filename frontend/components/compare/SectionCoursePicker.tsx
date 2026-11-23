"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { labelStyles } from "@/app/fonts";
import { api } from "@/lib/api";
import { termsBefore } from "@/lib/compare-courses";
import { sectionComparisonHref } from "@/lib/course-routes";
import { formatSemesterCode } from "@/lib/semester";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import { cn } from "@/lib/utils";
import type { Course, Department } from "@/lib/types";

/** Terms offered in the picker: the enrolling term and the eight before it. */
export const PICKER_TERMS = 9;

interface SectionCoursePickerProps {
  /** Current course and term on a comparison page; omitted on the start page. */
  initial?: { deptId: number; courseId: number; semesterCode: number };
}

/** Department, course and term pickers for Compare sections; opens the comparison URL. */
export default function SectionCoursePicker({ initial }: SectionCoursePickerProps) {
  const router = useRouter();
  const setupRequest = useRetryableRequest();
  const [setup, setSetup] = useState<{ attempt: number; departments: Department[]; terms: number[] } | { attempt: number; failed: true } | null>(null);
  const [deptId, setDeptId] = useState(initial ? String(initial.deptId) : "");
  const [courseId, setCourseId] = useState(initial ? String(initial.courseId) : "");
  const [semester, setSemester] = useState(initial ? String(initial.semesterCode) : "");
  const coursesRequest = useRetryableRequest();
  const [coursesResult, setCoursesResult] = useState<{ key: string; data: Course[] | null } | null>(null);

  useEffect(() => {
    let active = true;
    const attempt = setupRequest.requestVersion;
    Promise.all([api.getDepartments(), api.getEnrollingTerm()])
      .then(([departments, term]) => {
        if (!active) return;
        const sorted = [...departments].sort((a, b) => a.deptCode.localeCompare(b.deptCode));
        setSetup({ attempt, departments: sorted, terms: [term.semesterCode, ...termsBefore(term.semesterCode, PICKER_TERMS - 1)] });
        setSemester((current) => current || String(term.semesterCode));
      })
      .catch(() => active && setSetup({ attempt, failed: true }));
    return () => {
      active = false;
    };
  }, [setupRequest.requestVersion]);

  const coursesKey = deptId ? `${deptId}#${coursesRequest.requestVersion}` : "";
  useEffect(() => {
    if (!deptId) return;
    let active = true;
    const key = coursesKey;
    api
      .getCourses(Number(deptId))
      .then((data) => active && setCoursesResult({ key, data: [...data].sort((a, b) => a.courseNumber.localeCompare(b.courseNumber, undefined, { numeric: true })) }))
      .catch(() => active && setCoursesResult({ key, data: null }));
    return () => {
      active = false;
    };
  }, [deptId, coursesKey]);

  const ready = setup !== null && !("failed" in setup);
  const departments = ready ? setup.departments : [];
  const baseTerms = ready ? setup.terms : [];
  // A comparison link can point at an older term than the picker lists; keep it selectable.
  const terms = initial && !baseTerms.includes(initial.semesterCode) ? [...baseTerms, initial.semesterCode] : baseTerms;
  const courses = coursesResult?.key === coursesKey ? coursesResult.data : null;
  const coursesFailed = Boolean(deptId) && coursesResult?.key === coursesKey && coursesResult.data === null;

  const department = departments.find((d) => d.deptId === Number(deptId));
  const course = courses?.find((c) => c.courseId === Number(courseId));
  const canShow = Boolean(department && course && semester);

  return (
    <div className="mb-8">
      {setup !== null && "failed" in setup && (
        <ErrorMessage className="mb-4" title="Couldn't load the pickers" message="Departments and terms didn't load." onRetry={setupRequest.retry} />
      )}
      {coursesFailed && (
        <ErrorMessage className="mb-4" title="Couldn't load courses" message="Courses for this department didn't load." onRetry={coursesRequest.retry} />
      )}
      <form
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_12rem_auto] lg:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (department && course && semester) {
            router.push(sectionComparisonHref(department.deptCode, course.courseNumber, Number(semester)));
          }
        }}
      >
        <div>
          <label htmlFor="compare-section-department" className={cn(labelStyles.lg, "mb-2 block text-text-primary")}>
            Department
          </label>
          <NativeSelect
            id="compare-section-department"
            className="w-full"
            value={deptId}
            disabled={!ready}
            onChange={(event) => {
              setDeptId(event.target.value);
              setCourseId("");
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
          <label htmlFor="compare-section-course" className={cn(labelStyles.lg, "mb-2 block text-text-primary")}>
            Course
          </label>
          <NativeSelect id="compare-section-course" className="w-full" value={courseId} disabled={!courses} onChange={(event) => setCourseId(event.target.value)}>
            <NativeSelectOption value="">{!deptId ? "Select a department first" : !courses ? "Loading courses…" : "Select a course"}</NativeSelectOption>
            {(courses ?? []).map((c) => (
              <NativeSelectOption key={c.courseId} value={c.courseId}>
                {c.courseNumber} · {c.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="compare-section-semester" className={cn(labelStyles.lg, "mb-2 block text-text-primary")}>
            Term
          </label>
          <NativeSelect id="compare-section-semester" className="w-full" value={semester} disabled={terms.length === 0} onChange={(event) => setSemester(event.target.value)}>
            {terms.map((code) => (
              <NativeSelectOption key={code} value={code}>
                {formatSemesterCode(code)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" disabled={!canShow}>
          Show sections
        </Button>
      </form>
    </div>
  );
}
