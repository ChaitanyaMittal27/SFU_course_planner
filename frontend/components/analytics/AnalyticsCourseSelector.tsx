import type { ReactNode } from "react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { labelStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";
import type { Course, Department } from "@/lib/api";

type AnalyticsCourseSelectorProps = {
  departments: Department[];
  /** Courses of the selected department; null while they load. */
  courses: Course[] | null;
  selectedDepartmentId: string;
  selectedCourseId: string;
  disabled?: boolean;
  onDepartmentChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  /** Extra controls on the right (e.g. the time range toggle). */
  children?: ReactNode;
};

/** Department and course pickers for the graphs, on the page background. */
export default function AnalyticsCourseSelector({
  departments,
  courses,
  selectedDepartmentId,
  selectedCourseId,
  disabled = false,
  onDepartmentChange,
  onCourseChange,
  children,
}: AnalyticsCourseSelectorProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="grid w-full gap-4 sm:w-auto sm:grid-cols-[16rem_20rem]">
        <div>
          <label htmlFor="analytics-department" className={cn(labelStyles.lg, "mb-2 block text-text-primary")}>
            Department
          </label>
          <NativeSelect
            id="analytics-department"
            className="w-full"
            value={selectedDepartmentId}
            disabled={disabled || departments.length === 0}
            onChange={(event) => onDepartmentChange(event.target.value)}
          >
            <NativeSelectOption value="">Select a department</NativeSelectOption>
            {departments.map((department) => (
              <NativeSelectOption key={department.deptId} value={department.deptId}>
                {department.deptCode} · {department.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="analytics-course" className={cn(labelStyles.lg, "mb-2 block text-text-primary")}>
            Course
          </label>
          <NativeSelect
            id="analytics-course"
            className="w-full"
            value={selectedCourseId}
            disabled={disabled || !selectedDepartmentId || courses === null}
            onChange={(event) => onCourseChange(event.target.value)}
          >
            <NativeSelectOption value="">
              {!selectedDepartmentId ? "Select a department first" : courses === null ? "Loading courses…" : "Select a course"}
            </NativeSelectOption>
            {(courses ?? []).map((course) => (
              <NativeSelectOption key={course.courseId} value={course.courseId}>
                {course.courseNumber} · {course.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
      {children}
    </div>
  );
}
