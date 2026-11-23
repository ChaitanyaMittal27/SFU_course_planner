"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import CourseSearch from "@/components/course/CourseSearch";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import { bodyStyles, headerStyles, labelStyles } from "@/app/fonts";
import { courseHref } from "@/lib/course-routes";
import { cn } from "@/lib/utils";

function BrowsePageContent() {
  const router = useRouter();
  const [deptId, setDeptId] = useQueryState("dept");

  const catalog = useCourseCatalog();
  const { departments, loadingDepartments, departmentsError, courseCache, courseErrors, loadCourses, retryCourses } = catalog;
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const selectedDept = useMemo(() => departments.find((d) => d.deptId === Number(deptId)) ?? null, [departments, deptId]);
  const pickerCourses = selectedDept ? courseCache[selectedDept.deptId] : undefined;
  const pickerError = selectedDept ? courseErrors[selectedDept.deptId] === true : false;

  useEffect(() => {
    if (selectedDept && !courseCache[selectedDept.deptId] && !courseErrors[selectedDept.deptId]) loadCourses(selectedDept.deptId);
  }, [selectedDept, courseCache, courseErrors, loadCourses]);

  return (
    <PageContainer>
      <PageHeader title="Browse courses" description="Search by course code, or pick a department." />

      {departmentsError && (
        <ErrorMessage
          className="mb-6"
          title="Couldn't load departments"
          message="The department list didn't load, so search and the pickers are unavailable."
          onRetry={catalog.retryDepartments}
        />
      )}
      {pickerError && selectedDept && (
        <ErrorMessage
          className="mb-6"
          title="Couldn't load courses"
          message={`Courses for ${selectedDept.deptCode} didn't load.`}
          onRetry={() => retryCourses(selectedDept.deptId)}
        />
      )}

      <section aria-labelledby="search-heading" className="max-w-2xl">
        <h2 id="search-heading" className="sr-only">
          Search
        </h2>
        <CourseSearch catalog={catalog} />
        <p className={cn(bodyStyles.sm, "mt-2 text-text-subtle")}>
          Start with a department code.
        </p>
      </section>

      <Separator className="my-10 max-w-2xl" />

      <section aria-labelledby="pick-heading" className="max-w-2xl">
        <h2 id="pick-heading" className={cn(headerStyles.md, "mb-4 text-text-primary")}>
          Or pick by department
        </h2>
        <form
          className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            const course = pickerCourses?.find((item) => item.courseId === Number(selectedCourseId));
            if (course && selectedDept) router.push(courseHref(selectedDept.deptCode, course.courseNumber));
          }}
        >
          <div>
            <label htmlFor="department-select" className={cn(labelStyles.lg, "mb-2 block text-text-primary")}>
              Department
            </label>
            <NativeSelect
              id="department-select"
              className="w-full"
              value={deptId ?? ""}
              disabled={loadingDepartments || departmentsError}
              onChange={(event) => {
                setDeptId(event.target.value || null);
                setSelectedCourseId("");
              }}
            >
              <NativeSelectOption value="">{loadingDepartments ? "Loading departments…" : "Select a department"}</NativeSelectOption>
              {departments.map((d) => (
                <NativeSelectOption key={d.deptId} value={d.deptId}>
                  {d.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div>
            <label htmlFor="course-select" className={cn(labelStyles.lg, "mb-2 block text-text-primary")}>
              Course
            </label>
            <NativeSelect
              id="course-select"
              className="w-full"
              value={selectedCourseId}
              disabled={!selectedDept || !pickerCourses}
              onChange={(event) => setSelectedCourseId(event.target.value)}
            >
              <NativeSelectOption value="">
                {!selectedDept ? "Select a department first" : !pickerCourses ? "Loading courses…" : "Select a course"}
              </NativeSelectOption>
              {(pickerCourses ?? []).map((course) => (
                <NativeSelectOption key={course.courseId} value={course.courseId}>
                  {course.courseNumber} · {course.title}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <Button type="submit" disabled={!selectedCourseId}>
            View offerings
          </Button>
        </form>
      </section>
    </PageContainer>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BrowsePageContent />
    </Suspense>
  );
}
