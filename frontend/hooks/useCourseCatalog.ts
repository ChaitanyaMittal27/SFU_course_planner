"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import type { Course, Department } from "@/lib/types";

function sortAlphaNum(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export interface CourseCatalog {
  departments: Department[];
  loadingDepartments: boolean;
  departmentsError: boolean;
  retryDepartments: () => void;
  /** Course lists by department ID, sorted by course number; loaded on demand. */
  courseCache: Record<number, Course[]>;
  courseErrors: Record<number, boolean>;
  /** Starts loading a department's courses (no-op while in flight). Safe to call from effects. */
  loadCourses: (deptId: number) => void;
  /** Clears a department's error so it loads again. */
  retryCourses: (deptId: number) => void;
}

/** The department list plus per-department course lists, shared by course search and pickers. */
export function useCourseCatalog(): CourseCatalog {
  const departmentsRequest = useRetryableRequest();
  const [departmentsResult, setDepartmentsResult] = useState<{ attempt: number; data: Department[] | null } | null>(null);
  const settledDepartments = departmentsResult?.attempt === departmentsRequest.requestVersion ? departmentsResult : null;
  const departments = useMemo(() => settledDepartments?.data ?? departmentsResult?.data ?? [], [settledDepartments, departmentsResult]);

  const [courseCache, setCourseCache] = useState<Record<number, Course[]>>({});
  const [courseErrors, setCourseErrors] = useState<Record<number, boolean>>({});
  const inFlight = useRef(new Set<number>());

  useEffect(() => {
    let active = true;
    const attempt = departmentsRequest.requestVersion;
    api
      .getDepartments()
      .then((data) => {
        if (active) setDepartmentsResult({ attempt, data: [...data].sort((a, b) => sortAlphaNum(a.deptCode ?? a.name, b.deptCode ?? b.name)) });
      })
      .catch(() => {
        if (active) setDepartmentsResult({ attempt, data: null });
      });
    return () => {
      active = false;
    };
  }, [departmentsRequest.requestVersion]);

  // Only sets state asynchronously, so effects may call it.
  const loadCourses = useCallback((id: number) => {
    if (inFlight.current.has(id)) return;
    inFlight.current.add(id);
    api
      .getCourses(id)
      .then((data) => setCourseCache((prev) => ({ ...prev, [id]: [...data].sort((a, b) => sortAlphaNum(a.courseNumber, b.courseNumber)) })))
      .catch(() => setCourseErrors((prev) => ({ ...prev, [id]: true })))
      .finally(() => inFlight.current.delete(id));
  }, []);

  const retryCourses = useCallback((id: number) => setCourseErrors((prev) => ({ ...prev, [id]: false })), []);

  return {
    departments,
    loadingDepartments: settledDepartments === null,
    departmentsError: settledDepartments !== null && settledDepartments.data === null,
    retryDepartments: departmentsRequest.retry,
    courseCache,
    courseErrors,
    loadCourses,
    retryCourses,
  };
}
