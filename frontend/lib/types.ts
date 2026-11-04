// API Response Types (matching Spring Boot DTOs)

// ----------------------------
// Common: Departments / Courses
// ----------------------------
export type Department = {
  deptId: number;
  deptCode: string;
  name: string;
};

export type Course = {
  courseId: number;
  deptId: number;
  courseNumber: string;
  title: string | null;
  description: string | null;
  units: number | null;
  degreeLevel: string | null;
  prerequisites: string | null;
  corequisites: string | null;
  designation: string | null;
};

// ----------------------------
// Browse: Offerings + Details
// ----------------------------
export interface CourseOffering {
  section: string;
  infoUrl: string;

  term: string;
  year: number;
  semesterCode: number;
  isEnrolling: boolean;

  location: string;
  instructors: string;

  enrolled: string;
  capacity: string;
  loadPercent: number;
}

export interface BookmarkOffering extends CourseOffering {
  bookmarkId: number;
  deptId: number;
  courseId: number;
}

export interface OfferingDetail {
  deptId: number;
  courseId: number;
  // Course identity
  deptCode: string; // "CMPT"
  courseNumber: string; // "276"
  title: string; // "Introduction to Software Engineering"

  // Term info
  year: number; // 2025
  term: string; // "fall" | "spring" | "summer"

  // Display info
  campus: string | null; // "Burnaby" (derived from sections)

  // CourseDiggers stats
  medianGrade: string | null; // "A-"
  failRate: number; // 2.52
  gradeDistribution: Record<string, number> | null;

  // Course metadata (from courses table)
  description: string | null;
  prerequisites: string | null;
  corequisites: string | null;
  units: number; // 3
  degreeLevel: string | null; // "UGRD"
  designation: string | null;

  // Sections (CourseSys)
  sections: CourseOffering[];

  // External links
  outlineUrl: string; // SFU outline link
}

// ----------------------------
// Rate My Professors (public)
// ----------------------------
export type RmpStatus = "MATCHED" | "NO_MATCH" | "UNAVAILABLE";

// Live RMP ratings for a matched professor. Null numbers mean RMP has no data.
export interface RmpTeacher {
  firstName: string;
  lastName: string;
  department: string | null; // as RMP lists it, e.g. "Computer Science"
  avgRating: number | null; // 0–5
  avgDifficulty: number | null; // 0–5
  numRatings: number | null;
  wouldTakeAgainPercent: number | null; // 0–100, unrounded
  profileUrl: string | null;
  matchScore: number | null; // 0–1
}

// GET /api/rmp?name=&deptCode=
export interface RmpLookup {
  status: RmpStatus;
  lookupId: number | null; // null only when UNAVAILABLE before anything was stored
  searchName: string; // "Margaret Hall"
  searchUrl: string; // RMP search for the name at SFU
  teacher: RmpTeacher | null; // present only when MATCHED
}

// POST /api/rmp/reports
export interface RmpReport {
  reportId: number;
}

// ----------------------------
// About
// ----------------------------
export interface AboutInfo {
  appName: string;
  authorName: string;
}

// ----------------------------
// Graph Data
// ----------------------------
// for grade distribution graph
export interface GradeDistribution {
  deptCode: string; // "CMPT"
  courseNumber: string; // "276"
  title: string; // "Introduction to Software Engineering"

  medianGrade: string; // "A-"
  failRate: number; // 2.52

  distribution: Record<string, number>; // { "A+": 68, "A": 218, "A-": 196, ... }
}
// for load + enrollement graphs
export interface EnrollmentDataPoint {
  semesterCode: number; // 1257
  term: string; // "fall", "spring", "summer"
  year: number; // 2025

  enrolled: number; // Total enrolled students
  capacity: number; // Total capacity
  loadPercent: number; // enrolled/capacity * 100
}

// ----------------------------
// Term Info
// ----------------------------
export interface TermInfo {
  year: number;
  term: string; // "spring" | "summer" | "fall"
  semesterCode: number;
}

// ----------------------------
// Bookmarks
// ----------------------------
export interface Bookmark {
  bookmarkId: number;
  deptId: number;
  courseId: number;
  semesterCode: number;
  section: string;
  createdAt: string; // ISO timestamp from backend
}

// ----------------------------
// User Preferences
// ----------------------------
export interface UserPreference {
  emailNotificationsEnabled: boolean;
  userEmail: string | null;
}

// ----------------------------
// Admin
// ----------------------------
export interface ServiceHealthCheck {
  service: string;
  status: "up" | "down";
  latencyMs: number;
  url: string;
}

export interface AdminTerm {
  termId: number;
  year: number;
  term: string;
  isCurrent: boolean;
  isEnrolling: boolean;
  updatedAt: string | null;
}

export interface UpdateTermsRequest {
  currentYear: number;
  currentTerm: string;
  enrollingYear: number;
  enrollingTerm: string;
}

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  provider: string;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  emailNotificationsEnabled: boolean;
  preferredEmail: string | null;
  lastNotifiedAt: string | null;
  bookmarkCount: number;
}

export interface AdminUserStats {
  totalUsers: number;
  newThisMonth: number;
  optedInNotifications: number;
  activeInLast30Days: number;
  providerGoogle: number;
  providerEmail: number;
}

export interface AdminUsersResponse {
  stats: AdminUserStats;
  users: AdminUser[];
}

export interface AdminUserBookmark {
  bookmarkId: number;
  deptCode: string;
  courseNumber: string;
  title: string;
  section: string;
  semesterCode: number;
}

export interface AdminUserDetailResponse {
  user: AdminUser;
  bookmarks: AdminUserBookmark[];
}

export interface AdminTopCourse {
  deptCode: string;
  courseNumber: string;
  title: string;
  departmentName: string;
  bookmarkCount: number;
}

export interface AdminDeptRanking {
  deptCode: string;
  departmentName: string;
  bookmarkCount: number;
  percentage: number;
}

export interface AdminBookmarkMonth {
  month: string;
  count: number;
}

export interface AdminBookmarkStats {
  totalBookmarks: number;
  avgPerUser: number;
  topDepartment: string;
  topDepartmentName: string;
  uniqueCourses: number;
}

export interface AdminBookmarksResponse {
  stats: AdminBookmarkStats;
  topCourses: AdminTopCourse[];
  departmentRankings: AdminDeptRanking[];
  monthlyGrowth: AdminBookmarkMonth[];
}

export interface AdminContactSubmission {
  id: string;
  name: string;
  email: string;
  reason: string | null;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  isReplied: boolean;
  replyMessage: string | null;
  replySentTo: string | null;
  repliedAt: string | null;
  submittedAt: string;
}

export interface AdminSupportStats {
  totalSubmissions: number;
  unreadCount: number;
  archivedCount: number;
}

export interface AdminSupportResponse {
  stats: AdminSupportStats;
  submissions: AdminContactSubmission[];
}
