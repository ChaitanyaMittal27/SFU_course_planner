// API Response Types (matching Spring Boot DTOs)

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

export interface AboutInfo {
  appName: string;
  authorName: string;
}

export interface Watcher {
  id: number;
  department: Department;
  course: Course;
  events: string[];
}

export interface GraphDataPoint {
  semesterCode: number;
  totalCoursesTaken: number;
}
