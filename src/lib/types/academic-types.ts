// Academic data types for local storage and calculations

export interface GradeRecord {
  id: string;                // UUID for local tracking
  courseId: string;          // Reference to Convex course ID
  courseCode: string;        // Cached for display (denormalized)
  courseTitle: string;       // Cached for display (denormalized)
  units: number;             // Cached from course (denormalized)
  numericalGrade?: number;   // 0-100, optional until entered
  letterGrade?: string;      // A, B+, B, C+, C, D+, D, F (calculated)
  gradePoint?: number;       // 0.0-4.0 (calculated from numerical)
  qualityPoints?: number;    // units * gradePoint (calculated)
  semesterId: string;        // Reference to semester
  notes?: string;            // Optional student notes
  createdAt: number;
  updatedAt: number;
}

export interface SemesterRecord {
  id: string;                // UUID
  yearLevel: number;         // 1, 2, 3, 4
  semesterType: 'first' | 'second' | 'summer';
  academicYear: string;      // e.g., "2023-2024"
  grades: string[];          // Array of GradeRecord IDs
  totalUnits?: number;       // Sum of all course units (calculated)
  totalQualityPoints?: number; // Sum of all quality points (calculated)
  semesterQPI?: number;      // totalQualityPoints / totalUnits (calculated)
  isCompleted: boolean;      // Whether semester is finished
  createdAt: number;
  updatedAt: number;
}

export interface AcademicRecord {
  id: string;                // Usually "main" (single record per user)
  semesters: string[];       // Array of SemesterRecord IDs
  totalUnits?: number;       // Cumulative units across all semesters
  totalQualityPoints?: number; // Cumulative quality points
  cumulativeQPI?: number;    // Overall QPI calculation
  yearlyQPIs: Array<{        // QPI calculations by academic year
    academicYear: string;
    firstSemQPI?: number;
    secondSemQPI?: number;  
    summerQPI?: number;
    yearlyQPI?: number;      // Average of semester QPIs
  }>;
  configuration: {
    totalYears: number;      // Number of academic years (1-6)
    includesSummer: boolean; // Whether student takes summer classes
  };
  lastCalculated: number;    // Timestamp of last QPI calculation
  version: number;           // Schema version for migrations
  createdAt: number;
  updatedAt: number;
}

// Grade scale definition
export interface GradeScale {
  [key: string]: {
    min: number;
    max: number;
    points: number;
  };
}

// Convex-related types (for reference)
export interface Course {
  _id: string;
  courseCode: string;
  title: string;
  units: number;
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  _id: string;
  name: string;
  description?: string;
  semesters: Array<{
    yearLevel: number;
    semesterType: 'first' | 'second' | 'summer';
    courses: Array<Course>;
  }>;
  createdAt: number;
  updatedAt: number;
}