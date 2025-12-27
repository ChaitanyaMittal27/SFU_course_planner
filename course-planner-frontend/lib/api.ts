import {
  Department,
  Course,
  AboutInfo,
  Watcher,
  GraphDataPoint,
  CourseOffering,
  OfferingDetail,
  GradeDistribution,
  EnrollmentDataPoint,
} from "@/lib/types";

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ----------------------------
// Generic fetch wrapper
// ----------------------------
async function fetchAPI<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

// ----------------------------
// API Functions
// ----------------------------
export const api = {
  // -------------------------
  // Departments / Courses
  // -------------------------
  // GET /api/departments
  getDepartments: () => fetchAPI<Department[]>("/api/departments"),

  // GET /api/departments/{deptId}/courses
  getCourses: (deptId: number) => fetchAPI<Course[]>(`/api/departments/${deptId}/courses`),

  // -------------------------
  // Offerings + Details
  // -------------------------
  // GET /api/departments/{deptId}/courses/{courseId}/offerings
  getOfferings: (deptId: number, courseId: number) =>
    fetchAPI<CourseOffering[]>(`/api/departments/${deptId}/courses/${courseId}/offerings`),

  // GET /api/departments/{deptId}/courses/{courseId}/offerings/{semesterCode}
  getOfferingDetail: (deptId: number, courseId: number, semesterCode: number) =>
    fetchAPI<OfferingDetail>(`/api/departments/${deptId}/courses/${courseId}/offerings/${semesterCode}`),

  // GET /api/watchers/{userId}/offerings
  getWatcherOfferings: (userId: number) => fetchAPI<CourseOffering[]>(`/api/watchers/${userId}/offerings`),

  // -------------------------
  // About
  // -------------------------
  // GET /api/about
  getAbout: () => fetchAPI<AboutInfo>("/api/about"),

  // -------------------------
  // Graph
  // -------------------------
  // GET /api/graph/grade-distribution?courseId={}
  getGradeDistribution: (courseId: number) =>
    fetchAPI<GradeDistribution>(`/api/graph/grade-distribution?courseId=${courseId}`),

  // -------------------------
  // Enrollment History (Charts A & B)
  // -------------------------
  // GET /api/graph/enrollment-history?deptId={}&courseId={}&range=5yr
  getEnrollmentHistory: (deptId: number, courseId: number, range: string = "5yr") =>
    fetchAPI<EnrollmentDataPoint[]>(
      `/api/graph/enrollment-history?deptId=${deptId}&courseId=${courseId}&range=${range}`
    ),

  // -------------------------
  // Watchers
  // -------------------------
  // GET /api/watchers
  getWatchers: () => fetchAPI<Watcher[]>("/api/watchers"),

  // POST /api/watchers
  // Body: { deptId, courseId, semesterCode, section }
  createWatcher: async (deptId: number, courseId: number, semesterCode: number, section: string): Promise<Watcher> => {
    const response = await fetch(`${API_BASE_URL}/api/watchers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deptId,
        courseId,
        semesterCode,
        section,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create watcher: ${response.status}`);
    }

    return (await response.json()) as Watcher;
  },

  // DELETE /api/watchers/{watcherId}
  deleteWatcher: async (watcherId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/watchers/${watcherId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`Failed to delete watcher: ${response.status}`);
    }
  },
};

// Export types
export type {
  Department,
  Course,
  CourseOffering,
  AboutInfo,
  Watcher,
  GradeDistribution,
  OfferingDetail,
  EnrollmentDataPoint,
};
