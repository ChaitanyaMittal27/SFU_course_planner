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
}
