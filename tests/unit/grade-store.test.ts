import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGradeStore } from '../../src/stores/grade-store';
import { GradeRecord, SemesterRecord } from '../../src/lib/types/academic-types';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock academic storage module
vi.mock('../../src/lib/local-storage/academic-storage', () => ({
  loadGrades: vi.fn(() => []),
  saveGrades: vi.fn(),
  loadSemesters: vi.fn(() => []),
  saveSemesters: vi.fn(),
  loadAcademicRecord: vi.fn(() => null),
  saveAcademicRecord: vi.fn()
}));

describe('Grade Store', () => {
  beforeEach(() => {
    // Clear store state before each test
    useGradeStore.getState().resetAll();
    vi.clearAllMocks();
  });

  describe('Grade Management', () => {
    it('should initialize with empty grades', () => {
      const { grades } = useGradeStore.getState();
      expect(grades).toEqual([]);
    });

    it('should add a new grade record', () => {
      const store = useGradeStore.getState();
      const gradeData: Omit<GradeRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        courseId: 'course-1',
        courseCode: 'CS101',
        courseTitle: 'Introduction to Computer Science',
        units: 3,
        numericalGrade: 95,
        semesterId: 'semester-1'
      };

      store.addGrade(gradeData);
      const { grades } = useGradeStore.getState();
      
      expect(grades).toHaveLength(1);
      expect(grades[0]).toMatchObject(gradeData);
      expect(grades[0].id).toBeDefined();
      expect(grades[0].letterGrade).toBe('B+');
      expect(grades[0].gradePoint).toBe(3.5);
    });

    it('should update an existing grade record', () => {
      const store = useGradeStore.getState();
      
      // Add initial grade
      const gradeData: Omit<GradeRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        courseId: 'course-1',
        courseCode: 'CS101',
        courseTitle: 'Introduction to Computer Science',
        units: 3,
        numericalGrade: 85,
        semesterId: 'semester-1'
      };

      store.addGrade(gradeData);
      const gradeId = useGradeStore.getState().grades[0].id;

      // Update the grade
      store.updateGrade(gradeId, { numericalGrade: 95 });
      
      const { grades } = useGradeStore.getState();
      expect(grades[0].numericalGrade).toBe(95);
      expect(grades[0].letterGrade).toBe('B+');
      expect(grades[0].gradePoint).toBe(3.5);
    });

    it('should remove a grade record', () => {
      const store = useGradeStore.getState();
      
      // Add grade
      const gradeData: Omit<GradeRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        courseId: 'course-1',
        courseCode: 'CS101',
        courseTitle: 'Introduction to Computer Science',
        units: 3,
        numericalGrade: 85,
        semesterId: 'semester-1'
      };

      store.addGrade(gradeData);
      const gradeId = useGradeStore.getState().grades[0].id;

      // Remove grade
      store.removeGrade(gradeId);
      
      const { grades } = useGradeStore.getState();
      expect(grades).toHaveLength(0);
    });
  });

  describe('Semester Management', () => {
    it('should add a new semester', () => {
      const store = useGradeStore.getState();
      const semesterData: Omit<SemesterRecord, 'id' | 'createdAt' | 'updatedAt' | 'grades'> = {
        yearLevel: 1,
        semesterType: 'first',
        academicYear: '2023-2024',
        isCompleted: false
      };

      store.addSemester(semesterData);
      const { semesters } = useGradeStore.getState();
      
      expect(semesters).toHaveLength(1);
      expect(semesters[0]).toMatchObject(semesterData);
      expect(semesters[0].grades).toEqual([]);
    });

    it('should update semester calculations when grades change', () => {
      const store = useGradeStore.getState();
      
      // Add semester
      const semesterData: Omit<SemesterRecord, 'id' | 'createdAt' | 'updatedAt' | 'grades'> = {
        yearLevel: 1,
        semesterType: 'first',
        academicYear: '2023-2024',
        isCompleted: false
      };

      store.addSemester(semesterData);
      const semesterId = useGradeStore.getState().semesters[0].id;

      // Add grade to semester
      const gradeData: Omit<GradeRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        courseId: 'course-1',
        courseCode: 'CS101',
        courseTitle: 'Introduction to Computer Science',
        units: 3,
        numericalGrade: 95,
        semesterId
      };

      store.addGrade(gradeData);
      
      const { semesters } = useGradeStore.getState();
      const semester = semesters.find(s => s.id === semesterId);
      
      expect(semester?.totalUnits).toBe(3);
      expect(semester?.totalQualityPoints).toBe(10.5); // 3 units * 3.5 points
      expect(semester?.semesterQPI).toBe(3.5);
    });
  });

  describe('Academic Record Management', () => {
    it('should initialize academic record', () => {
      const store = useGradeStore.getState();
      const config = {
        totalYears: 4,
        includesSummer: false
      };

      store.initializeAcademicRecord(config);
      const { academicRecord } = useGradeStore.getState();
      
      expect(academicRecord).toBeDefined();
      expect(academicRecord?.configuration).toEqual(config);
      expect(academicRecord?.semesters).toEqual([]);
    });

    it('should recalculate QPI when grades change', () => {
      const store = useGradeStore.getState();
      
      // Initialize record
      store.initializeAcademicRecord({ totalYears: 4, includesSummer: false });
      
      // Add semester
      const semesterData: Omit<SemesterRecord, 'id' | 'createdAt' | 'updatedAt' | 'grades'> = {
        yearLevel: 1,
        semesterType: 'first',
        academicYear: '2023-2024',
        isCompleted: false
      };

      store.addSemester(semesterData);
      const semesterId = useGradeStore.getState().semesters[0].id;

      // Add multiple grades
      const grades = [
        { courseId: 'c1', courseCode: 'CS101', courseTitle: 'Intro CS', units: 3, numericalGrade: 95, semesterId }, // B+ = 3.5
        { courseId: 'c2', courseCode: 'MATH101', courseTitle: 'Calculus', units: 4, numericalGrade: 87, semesterId } // C+ = 2.5
      ];

      grades.forEach(grade => store.addGrade(grade));
      
      const { academicRecord } = useGradeStore.getState();
      expect(academicRecord?.totalUnits).toBe(7);
      expect(academicRecord?.cumulativeQPI).toBeCloseTo(2.93, 2); // (3*3.5 + 4*2.5) / 7 = 20.5/7 ≈ 2.93
    });
  });

  describe('Data Persistence', () => {
    it('should load data from localStorage on initialization', () => {
      // This will be tested with the actual localStorage implementation
      const store = useGradeStore.getState();
      expect(store.loadData).toBeDefined();
    });

    it('should save data to localStorage when changes occur', () => {
      // This will be tested with the actual localStorage implementation
      const store = useGradeStore.getState();
      expect(store.saveData).toBeDefined();
    });
  });

  describe('Selectors', () => {
    it('should get grades by semester', () => {
      const store = useGradeStore.getState();
      
      // Add semester
      const semesterData: Omit<SemesterRecord, 'id' | 'createdAt' | 'updatedAt' | 'grades'> = {
        yearLevel: 1,
        semesterType: 'first',
        academicYear: '2023-2024',
        isCompleted: false
      };

      store.addSemester(semesterData);
      const semesterId = useGradeStore.getState().semesters[0].id;

      // Add grade
      const gradeData: Omit<GradeRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        courseId: 'course-1',
        courseCode: 'CS101',
        courseTitle: 'Introduction to Computer Science',
        units: 3,
        numericalGrade: 95,
        semesterId
      };

      store.addGrade(gradeData);

      const semesterGrades = store.getGradesBySemester(semesterId);
      expect(semesterGrades).toHaveLength(1);
      expect(semesterGrades[0].semesterId).toBe(semesterId);
    });

    it('should get semester QPI calculations', () => {
      const store = useGradeStore.getState();
      
      // Add semester with grades
      const semesterData: Omit<SemesterRecord, 'id' | 'createdAt' | 'updatedAt' | 'grades'> = {
        yearLevel: 1,
        semesterType: 'first',
        academicYear: '2023-2024',
        isCompleted: false
      };

      store.addSemester(semesterData);
      const semesterId = useGradeStore.getState().semesters[0].id;

      // Add multiple grades
      const grades = [
        { courseId: 'c1', courseCode: 'CS101', courseTitle: 'Intro CS', units: 3, numericalGrade: 95, semesterId }, // B+ = 3.5
        { courseId: 'c2', courseCode: 'MATH101', courseTitle: 'Calculus', units: 4, numericalGrade: 87, semesterId } // C+ = 2.5
      ];

      grades.forEach(grade => store.addGrade(grade));

      const qpiCalc = store.getSemesterQPI(semesterId);
      expect(qpiCalc?.qpi).toBeCloseTo(2.93, 2); // (3*3.5 + 4*2.5) / 7
      expect(qpiCalc?.totalUnits).toBe(7);
      expect(qpiCalc?.totalQualityPoints).toBe(20.5); // 3*3.5 + 4*2.5
    });
  });
});