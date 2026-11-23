import { api } from "@/lib/api";
import type { Course, Department } from "@/lib/types";
import { normalizeCourseIdentity, type CourseRouteIdentity, type CourseRouteReference } from "@/lib/course-routes";

export interface ResolvedCourseRoute extends CourseRouteReference {
  department: Department;
  course: Course;
}

const departmentsPromise = new Map<string, Promise<Department[]>>();
const coursesPromise = new Map<number, Promise<Course[]>>();

function loadDepartments() {
  const cacheKey = "all";
  const existing = departmentsPromise.get(cacheKey);
  if (existing) return existing;

  const request = api.getDepartments();
  departmentsPromise.set(cacheKey, request);
  // Forget a failed request so a retry calls the API again.
  request.catch(() => departmentsPromise.delete(cacheKey));
  return request;
}

function loadCourses(deptId: number) {
  const existing = coursesPromise.get(deptId);
  if (existing) return existing;

  const request = api.getCourses(deptId);
  coursesPromise.set(deptId, request);
  request.catch(() => coursesPromise.delete(deptId));
  return request;
}

export async function resolveCourseIdentity(identity: CourseRouteIdentity): Promise<ResolvedCourseRoute | null> {
  const normalized = normalizeCourseIdentity(identity.deptCode, identity.courseNumber);
  if (!normalized) return null;

  const departments = await loadDepartments();
  const department = departments.find((item) => item.deptCode.toLowerCase() === normalized.deptCode);
  if (!department) return null;

  const courses = await loadCourses(department.deptId);
  const course = courses.find((item) => item.courseNumber.toLowerCase() === normalized.courseNumber);
  if (!course) return null;

  return {
    deptId: department.deptId,
    courseId: course.courseId,
    deptCode: department.deptCode.toLowerCase(),
    courseNumber: course.courseNumber.toLowerCase(),
    department,
    course,
  };
}

export async function resolveCourseIds(deptId: number, courseId: number): Promise<ResolvedCourseRoute | null> {
  if (!Number.isSafeInteger(deptId) || !Number.isSafeInteger(courseId) || deptId <= 0 || courseId <= 0) return null;

  const departments = await loadDepartments();
  const department = departments.find((item) => item.deptId === deptId);
  if (!department) return null;

  const courses = await loadCourses(deptId);
  const course = courses.find((item) => item.courseId === courseId);
  if (!course) return null;

  return {
    deptId,
    courseId,
    deptCode: department.deptCode.toLowerCase(),
    courseNumber: course.courseNumber.toLowerCase(),
    department,
    course,
  };
}
