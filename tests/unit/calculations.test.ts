import { describe, it, expect } from 'vitest';
import { calculateQPI, calculateSemesterQPI, calculateCumulativeQPI, calculateYearlyQPI } from '../../src/lib/calculations/qpi-calculator';
import { GradeRecord, SemesterRecord } from '../../src/lib/types/academic-types';

describe('QPI Calculator', () => {
  describe('calculateQPI', () => {
    it('should calculate QPI for a single subject', () => {
      const gradeRecord: GradeRecord = {
        id: '1',
        courseId: 'course1',
        courseCode: 'CS101',
        courseTitle: 'Computer Science 1',
        units: 3,
        numericalGrade: 95,
        letterGrade: 'B+',
        gradePoint: 3.5,
        qualityPoints: 10.5, // 3 * 3.5
        semesterId: 'sem1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const qpi = calculateQPI([gradeRecord]);
      expect(qpi).toBeCloseTo(3.5, 2);
    });

    it('should calculate weighted QPI for multiple subjects', () => {
      const gradeRecords: GradeRecord[] = [
        {
          id: '1',
          courseId: 'course1',
          courseCode: 'CS101',
          courseTitle: 'Computer Science 1',
          units: 3,
          numericalGrade: 95,
          letterGrade: 'B+',
          gradePoint: 3.5,
          qualityPoints: 10.5, // 3 * 3.5
          semesterId: 'sem1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          courseId: 'course2',
          courseCode: 'MATH101',
          courseTitle: 'Calculus 1',
          units: 4,
          numericalGrade: 88,
          letterGrade: 'C+',
          gradePoint: 2.5,
          qualityPoints: 10.0, // 4 * 2.5
          semesterId: 'sem1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const qpi = calculateQPI(gradeRecords);
      // Total quality points: 10.5 + 10.0 = 20.5
      // Total units: 3 + 4 = 7
      // QPI: 20.5 / 7 = 2.93
      expect(qpi).toBeCloseTo(2.93, 2);
    });

    it('should return 0 for empty grade records', () => {
      const qpi = calculateQPI([]);
      expect(qpi).toBe(0);
    });

    it('should handle records without quality points', () => {
      const gradeRecords: GradeRecord[] = [
        {
          id: '1',
          courseId: 'course1',
          courseCode: 'CS101',
          courseTitle: 'Computer Science 1',
          units: 3,
          semesterId: 'sem1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const qpi = calculateQPI(gradeRecords);
      expect(qpi).toBe(0);
    });
  });

  describe('calculateSemesterQPI', () => {
    it('should calculate QPI for a semester', () => {
      const semesterRecord: SemesterRecord = {
        id: 'sem1',
        yearLevel: 1,
        semesterType: 'first',
        academicYear: '2023-2024',
        grades: ['grade1', 'grade2'],
        totalUnits: 7,
        totalQualityPoints: 20.5,
        isCompleted: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const qpi = calculateSemesterQPI(semesterRecord);
      expect(qpi).toBeCloseTo(2.93, 2);
    });

    it('should return 0 for semester with no units', () => {
      const semesterRecord: SemesterRecord = {
        id: 'sem1',
        yearLevel: 1,
        semesterType: 'first',
        academicYear: '2023-2024',
        grades: [],
        totalUnits: 0,
        totalQualityPoints: 0,
        isCompleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const qpi = calculateSemesterQPI(semesterRecord);
      expect(qpi).toBe(0);
    });
  });

  describe('calculateCumulativeQPI', () => {
    it('should calculate cumulative QPI across multiple semesters', () => {
      const semesters: SemesterRecord[] = [
        {
          id: 'sem1',
          yearLevel: 1,
          semesterType: 'first',
          academicYear: '2023-2024',
          grades: ['grade1', 'grade2'],
          totalUnits: 7,
          totalQualityPoints: 20.5,
          semesterQPI: 2.93,
          isCompleted: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'sem2',
          yearLevel: 1,
          semesterType: 'second',
          academicYear: '2023-2024',
          grades: ['grade3', 'grade4'],
          totalUnits: 6,
          totalQualityPoints: 21.0, // Higher performance
          semesterQPI: 3.5,
          isCompleted: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const cumulativeQPI = calculateCumulativeQPI(semesters);
      // Total quality points: 20.5 + 21.0 = 41.5
      // Total units: 7 + 6 = 13
      // Cumulative QPI: 41.5 / 13 = 3.19
      expect(cumulativeQPI).toBeCloseTo(3.19, 2);
    });

    it('should return 0 for empty semester list', () => {
      const cumulativeQPI = calculateCumulativeQPI([]);
      expect(cumulativeQPI).toBe(0);
    });
  });

  describe('calculateYearlyQPI', () => {
    it('should calculate yearly QPI from semester QPIs', () => {
      const firstSemQPI = 2.93;
      const secondSemQPI = 3.5;

      const yearlyQPI = calculateYearlyQPI(firstSemQPI, secondSemQPI);
      // Average: (2.93 + 3.5) / 2 = 3.215
      expect(yearlyQPI).toBeCloseTo(3.215, 2);
    });

    it('should handle single semester', () => {
      const yearlyQPI = calculateYearlyQPI(3.0);
      expect(yearlyQPI).toBe(3.0);
    });

    it('should include summer semester in weighted average', () => {
      const firstSemQPI = 3.0;
      const secondSemQPI = 3.5;
      const summerQPI = 4.0;
      const firstSemUnits = 18;
      const secondSemUnits = 20;
      const summerUnits = 6;

      const yearlyQPI = calculateYearlyQPI(
        firstSemQPI,
        secondSemQPI,
        summerQPI,
        firstSemUnits,
        secondSemUnits,
        summerUnits
      );

      // Weighted average: (3.0*18 + 3.5*20 + 4.0*6) / (18+20+6) = 3.36
      expect(yearlyQPI).toBeCloseTo(3.36, 2);
    });
  });
});