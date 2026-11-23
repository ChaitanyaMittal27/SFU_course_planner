"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";
import type { CourseCatalog } from "@/hooks/useCourseCatalog";
import { courseHref } from "@/lib/course-routes";
import { searchCourses } from "@/lib/course-search";
import { formatCourseCode } from "@/lib/course-stats";
import { cn } from "@/lib/utils";
import type { Course, Department } from "@/lib/types";

export const NO_MATCH_TEXT = "No courses match. Try a course code like CMPT 225.";

interface CourseSearchProps {
  catalog: CourseCatalog;
  /** Accessible name and visible label of the combobox. */
  label?: string;
  className?: string;
}

/**
 * Course combobox (shadcn Command in a Popover): forgiving course codes, one-typo
 * department matching and title words within a department (lib/course-search).
 * Enter opens the highlighted course.
 */
export default function CourseSearch({ catalog, label = "Find a course", className }: CourseSearchProps) {
  const router = useRouter();
  const { departments, loadingDepartments, departmentsError, courseCache, courseErrors, loadCourses, retryCourses } = catalog;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const outcome = useMemo(() => searchCourses(query, departments, courseCache), [query, departments, courseCache]);
  const searchDeptId = outcome.kind === "needsCourses" ? outcome.department.deptId : null;
  const searchError = searchDeptId !== null && courseErrors[searchDeptId] === true;

  useEffect(() => {
    if (searchDeptId !== null && !courseErrors[searchDeptId]) loadCourses(searchDeptId);
  }, [searchDeptId, courseErrors, loadCourses]);

  const openCourse = (dept: Department, course: Course) => {
    setOpen(false);
    setQuery("");
    router.push(courseHref(dept.deptCode, course.courseNumber));
  };

  const suggestion = (outcome.kind === "results" || outcome.kind === "needsCourses") && outcome.suggestion;
  const failedDept = searchError ? departments.find((d) => d.deptId === searchDeptId) ?? null : null;

  return (
    <div className={className}>
      {failedDept && (
        <ErrorMessage
          className="mb-4"
          title="Couldn't load courses"
          message={`Courses for ${failedDept.deptCode} didn't load.`}
          onRetry={() => retryCourses(failedDept.deptId)}
        />
      )}
      <Command shouldFilter={false} label={label} className="overflow-visible rounded-none! bg-transparent p-0">
        {/* cmdk labels the input itself (label prop above); this is the visible copy. */}
        <p aria-hidden="true" className={cn(labelStyles.lg, "mb-2 text-text-primary")}>
          {label}
        </p>
        <Popover open={open && outcome.kind !== "idle"} onOpenChange={setOpen}>
          <div ref={anchorRef}>
            <CommandInput
              placeholder="Try CMPT 225 or cmpt data struct"
              value={query}
              onValueChange={(value) => {
                setQuery(value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
              }}
              disabled={loadingDepartments || departmentsError}
              className={bodyStyles.md}
            />
          </div>
          <PopoverContent anchor={anchorRef} align="start" initialFocus={false} finalFocus={false} className="w-(--anchor-width) p-1">
            <CommandList>
              {suggestion && (
                <p className={cn(bodyStyles.sm, "px-2 pt-1.5 pb-1 text-text-muted")}>
                  Did you mean <span className="font-semibold text-text-primary">{suggestion.deptCode}</span>?
                </p>
              )}
              {outcome.kind === "needsCourses" && !searchError && <LoadingSpinner size="sm" label="Loading courses" />}
              {(outcome.kind === "noDepartment" || (outcome.kind === "results" && outcome.matches.length === 0)) && (
                <CommandEmpty className={cn(bodyStyles.md, "py-4 text-text-muted")}>{NO_MATCH_TEXT}</CommandEmpty>
              )}
              {outcome.kind === "results" && outcome.matches.length > 0 && (
                <CommandGroup>
                  {outcome.matches.map(({ department, course }) => (
                    <CommandItem
                      key={course.courseId}
                      value={`${department.deptId}-${course.courseId}`}
                      onSelect={() => openCourse(department, course)}
                      className="items-start gap-3 py-2"
                    >
                      <span className={cn(numericStyles.md, "w-24 shrink-0 font-medium text-text-primary")}>
                        {formatCourseCode(department.deptCode, course.courseNumber)}
                      </span>
                      <span className="min-w-0">
                        <span className={cn(bodyStyles.md, "block text-text-primary")}>{course.title ?? "Untitled course"}</span>
                        <span className={cn(bodyStyles.sm, "block text-text-muted")}>{department.name}</span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </PopoverContent>
        </Popover>
      </Command>
    </div>
  );
}
