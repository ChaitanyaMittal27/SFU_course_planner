import {
  Department,
  Course,
  AboutInfo,
  Bookmark,
  CourseOffering,
  OfferingDetail,
  GradeDistribution,
  EnrollmentDataPoint,
  TermInfo,
  UserPreference,
  ServiceHealthCheck,
  AdminTerm,
  UpdateTermsRequest,
  AdminUsersResponse,
  AdminUserDetailResponse,
  AdminUser,
  AdminUserBookmark,
} from "@/lib/types";
import { supabase } from "@/lib/supabase/client";

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ----------------------------
// Get JWT from Supabase session
// ----------------------------
async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ----------------------------
// Generic fetch wrapper (public endpoints)
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
// Generic fetch wrapper (authenticated endpoints)
// fetchAuthAPI automatically:
//    a) Gets token: const token = await getAuthToken();
//    b) Adds header: Authorization: Bearer
//    c) Makes request to backend
// ----------------------------
async function fetchAuthAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get JWT token
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Not authenticated - please log in");
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Session expired - please log in again");
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Handle 204 No Content (DELETE responses)
    if (response.status === 204) {
      return undefined as T;
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
  // Departments / Courses (Public)
  // -------------------------

  // GET /api/departments
  getDepartments: () => fetchAPI<Department[]>("/api/departments"),

  // GET /api/departments/{deptId}/courses
  getCourses: (deptId: number) => fetchAPI<Course[]>(`/api/departments/${deptId}/courses`),

  // -------------------------
  // Offerings + Details (Public)
  // -------------------------

  // GET /api/departments/{deptId}/courses/{courseId}/offerings
  getOfferings: (deptId: number, courseId: number) =>
    fetchAPI<CourseOffering[]>(`/api/departments/${deptId}/courses/${courseId}/offerings`),

  // GET /api/departments/{deptId}/courses/{courseId}/offerings/{semesterCode}
  getOfferingDetail: (deptId: number, courseId: number, semesterCode: number) =>
    fetchAPI<OfferingDetail>(`/api/departments/${deptId}/courses/${courseId}/offerings/${semesterCode}`),

  // -------------------------
  // About (Public)
  // -------------------------

  // GET /api/about
  getAbout: () => fetchAPI<AboutInfo>("/api/about"),

  // -------------------------
  // Graph (Public)
  // -------------------------

  // GET /api/graph/grade-distribution?courseId={}
  getGradeDistribution: (courseId: number) =>
    fetchAPI<GradeDistribution>(`/api/graph/grade-distribution?courseId=${courseId}`),

  // GET /api/graph/enrollment-history?deptId={}&courseId={}&range=5yr
  getEnrollmentHistory: (deptId: number, courseId: number, range: string = "5yr") =>
    fetchAPI<EnrollmentDataPoint[]>(
      `/api/graph/enrollment-history?deptId=${deptId}&courseId=${courseId}&range=${range}`,
    ),

  // -------------------------
  // Term Info (Public)
  // -------------------------
  // GET /api/terms/enrolling
  getEnrollingTerm: () => fetchAPI<TermInfo>("/api/terms/enrolling"),

  // -------------------------
  // Bookmarks (Authenticated - JWT Required)
  // -------------------------
  /**
   * Get all bookmarks for authenticated user
   *
   * @returns List of user's bookmarks
   */
  getBookmarks: () => fetchAuthAPI<Bookmark[]>("/api/bookmarks"),

  /**
   * Get watched offerings with live enrollment data
   *
   * @returns List of watched course offerings with enrollment data
   */
  getBookmarkOfferings: () => fetchAuthAPI<CourseOffering[]>("/api/bookmarks/offerings"),

  /**
   * Create a new bookmark for authenticated user
   *
   *
   * @param deptId Department ID
   * @param courseId Course ID
   * @param semesterCode Semester code (e.g., 1257)
   * @param section Section (e.g., "D100")
   * @returns Created bookmark
   */
  createBookmark: async (
    deptId: number,
    courseId: number,
    semesterCode: number,
    section: string,
  ): Promise<Bookmark> => {
    return fetchAuthAPI<Bookmark>("/api/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deptId,
        courseId,
        semesterCode,
        section,
      }),
    });
  },

  /**
   * Delete a bookmark (ownership verified by backend)
   *
   * @param bookmarkId Bookmark ID to delete
   */
  deleteBookmark: async (bookmarkId: number): Promise<void> => {
    return fetchAuthAPI<void>(`/api/bookmarks/${bookmarkId}`, {
      method: "DELETE",
    });
  },

  // -------------------------
  // User Preferences (Authenticated - JWT Required)
  // -------------------------
  /**
   * Get all user preferences for authenticated user.
   * Returns both email notification toggle state and preferred email.
   * Defaults to false + null email if no preference exists.
   *
   * @returns User preferences (emailNotificationsEnabled + userEmail)
   */
  getUserPreferences: () => fetchAuthAPI<UserPreference>("/api/preferences/email-notifications"),

  /**
   * Update email notification toggle for authenticated user.
   * Does not affect preferred email.
   *
   * @param enabled - Whether to enable email notifications
   * @returns Updated user preferences
   */
  updateEmailNotificationPreference: async (enabled: boolean): Promise<UserPreference> =>
    fetchAuthAPI<UserPreference>("/api/preferences/email-notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailNotificationsEnabled: enabled }),
    }),

  /**
   * Update preferred email for authenticated user.
   * Does not affect notification toggle state.
   *
   * @param userEmail - New preferred email address
   * @returns Updated user preferences
   */
  updatePreferredEmail: async (userEmail: string): Promise<UserPreference> =>
    fetchAuthAPI<UserPreference>("/api/preferences/email-notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail }),
    }),

  /**
   * Initialize user preferences on signup.
   * Sets preferred email to signup email and enables
   * email notifications by default.
   * If preferences already exist, returns existing row without overwriting.
   *
   * @param userEmail - User's signup email address
   * @returns Created or existing user preferences
   */
  initializePreferencesOnSignup: async (userEmail: string): Promise<UserPreference> =>
    fetchAuthAPI<UserPreference>("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail,
        emailNotificationsEnabled: true,
      }),
    }),

  // -------------------------
  // Admin (Authenticated — JWT + admin role required)
  // -------------------------

  getHealthStatus: () => fetchAuthAPI<ServiceHealthCheck[]>("/api/admin/health"),

  getServiceHealth: (service: string) =>
    fetchAuthAPI<ServiceHealthCheck[]>(`/api/admin/health?service=${service}`),

  getAdminTerms: () => fetchAuthAPI<AdminTerm[]>("/api/admin/terms"),

  updateTerms: (data: UpdateTermsRequest) =>
    fetchAuthAPI<AdminTerm[]>("/api/admin/terms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  getAdminUsers: () => fetchAuthAPI<AdminUsersResponse>("/api/admin/users"),

  getAdminUser: (id: string) => fetchAuthAPI<AdminUserDetailResponse>(`/api/admin/users/${id}`),
};

// Export types
export type {
  Department,
  Course,
  CourseOffering,
  AboutInfo,
  Bookmark,
  GradeDistribution,
  OfferingDetail,
  EnrollmentDataPoint,
  TermInfo,
  UserPreference,
  ServiceHealthCheck,
  AdminTerm,
  UpdateTermsRequest,
  AdminUsersResponse,
  AdminUserDetailResponse,
  AdminUser,
  AdminUserBookmark,
};
