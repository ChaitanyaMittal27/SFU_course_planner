import { Department, Course, AboutInfo, Watcher, GraphDataPoint, CourseOffering, OfferingDetail } from "@/lib/types";

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Generic fetch wrapper with error handling
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

// API Functions (matching your Spring Boot endpoints)
export const api = {
  // GET /api/departments
  getDepartments: () => fetchAPI<Department[]>("/api/departments"),

  // GET /api/departments/{deptId}/courses
  getCourses: (deptId: number) => fetchAPI<Course[]>(`/api/departments/${deptId}/courses`),

  // GET /api/departments/{deptId}/courses/{courseId}/offerings
  getOfferings: (deptId: number, courseId: number) =>
    fetchAPI<CourseOffering[]>(`/api/departments/${deptId}/courses/${courseId}/offerings`),

  // GET /api/departments/{deptId}/courses/{courseId}/offerings/{semesterCode}
  getOfferingDetail: (deptId: number, courseId: number, semesterCode: number) =>
    fetchAPI<OfferingDetail>(`/api/departments/${deptId}/courses/${courseId}/offerings/${semesterCode}`),

  // GET /api/about
  getAbout: () => fetchAPI<AboutInfo>("/api/about"),

  // GET /api/watchers
  getWatchers: () => fetchAPI<Watcher[]>("/api/watchers"),

  // GET /api/stats/students-per-semester?deptId={deptId}
  getGraphData: (deptId: number) => fetchAPI<GraphDataPoint[]>(`/api/stats/students-per-semester?deptId=${deptId}`),

  // GET /api/stats/students-per-semester?deptId={deptId}&courseId={courseId}
  //getCourseLoad: (deptId: number, courseId: number) =>
  //fetchAPI<CourseLoadData[]>(`/api/stats/course-load?deptId=${deptId}&courseId=${courseId}`),

  // POST /api/watchers - Backend returns TEXT not JSON
  createWatcher: async (deptId: number, courseId: number): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/watchers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deptId, courseId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create watcher: ${response.status}`);
    }

    return await response.text(); // Backend returns plain text
  },

  // DELETE /api/watchers/{watcherId} - Backend returns TEXT not JSON
  deleteWatcher: async (watcherId: number): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/watchers/${watcherId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete watcher: ${response.status}`);
    }

    return await response.text(); // Backend returns plain text
  },
};

// Export types
export type { Department, Course, CourseOffering, AboutInfo, Watcher, GraphDataPoint, OfferingDetail };
