import { describe, it, expect } from 'vitest';
import { parseCSV, validateCSVStructure, convertCSVToGradeRecords, parseGradeEntry } from '../../src/lib/csv-handler/csv-import';
import { convertGradeRecordsToCSV, convertGradeRecordsToCSVWithSemesterData, exportAcademicRecordToCSV } from '../../src/lib/csv-handler/csv-export';
import type { GradeRecord, SemesterRecord, AcademicRecord } from '../../src/lib/types/academic-types';

describe('CSV Import Handler', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV content', () => {
      const csvContent = `courseCode,title,units,numericalGrade
CS101,Computer Science 1,3,95
MATH101,Calculus 1,4,88`;

      const result = parseCSV(csvContent);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        courseCode: 'CS101',
        title: 'Computer Science 1',
        units: '3',
        numericalGrade: '95',
      });
    });

    it('should handle CSV with headers and whitespace', () => {
      const csvContent = `  courseCode  ,  title  ,  units  ,  numericalGrade  
  CS101  ,  Computer Science 1  ,  3  ,  95  
  MATH101  ,  Calculus 1  ,  4  ,  88  `;

      const result = parseCSV(csvContent);
      expect(result).toHaveLength(2);
      expect(result[0].courseCode).toBe('CS101');
      expect(result[0].title).toBe('Computer Science 1');
    });

    it('should handle empty CSV', () => {
      const result = parseCSV('');
      expect(result).toHaveLength(0);
    });

    it('should handle CSV with only headers', () => {
      const csvContent = 'courseCode,title,units,numericalGrade';
      const result = parseCSV(csvContent);
      expect(result).toHaveLength(0);
    });

    it('should handle quoted fields with commas', () => {
      const csvContent = `courseCode,title,units,numericalGrade
CS101,"Computer Science 1, Introduction",3,95
MATH101,"Calculus 1, Differential",4,88`;

      const result = parseCSV(csvContent);
      expect(result[0].title).toBe('Computer Science 1, Introduction');
      expect(result[1].title).toBe('Calculus 1, Differential');
    });
  });

  describe('validateCSVStructure', () => {
    it('should validate correct CSV structure', () => {
      const data = [
        { courseCode: 'CS101', title: 'Computer Science 1', units: '3', numericalGrade: '95' },
        { courseCode: 'MATH101', title: 'Calculus 1', units: '4', numericalGrade: '88' },
      ];

      const result = validateCSVStructure(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject CSV missing required columns', () => {
      const data = [
        { courseCode: 'CS101', title: 'Computer Science 1' }, // Missing units, numericalGrade
      ];

      const result = validateCSVStructure(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required column: Units, units, or units');
      expect(result.errors).toContain('Missing required column: Numerical Grade, numericalGrade, or numericalGrade');
    });

    it('should validate data types', () => {
      const data = [
        { courseCode: 'CS101', title: 'Computer Science 1', units: 'invalid', numericalGrade: 'not-a-number' },
      ];

      const result = validateCSVStructure(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid units value'))).toBe(true);
      expect(result.errors.some(error => error.includes('Invalid numerical grade value'))).toBe(true);
    });

    it('should validate grade ranges', () => {
      const data = [
        { courseCode: 'CS101', title: 'Computer Science 1', units: '3', numericalGrade: '150' }, // Invalid grade > 100
        { courseCode: 'MATH101', title: 'Calculus 1', units: '4', numericalGrade: '-10' }, // Invalid grade < 0
      ];

      const result = validateCSVStructure(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('150'))).toBe(true);
      expect(result.errors.some(error => error.includes('-10'))).toBe(true);
    });

    it('should validate units range', () => {
      const data = [
        { courseCode: 'CS101', title: 'Computer Science 1', units: '0', numericalGrade: '95' }, // Invalid units = 0
        { courseCode: 'MATH101', title: 'Calculus 1', units: '10', numericalGrade: '88' }, // Invalid units > 6
      ];

      const result = validateCSVStructure(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('units'))).toBe(true);
    });
  });

  describe('convertCSVToGradeRecords', () => {
    it('should convert valid CSV data to grade records', () => {
      const csvData = [
        { courseCode: 'CS101', title: 'Computer Science 1', units: '3', numericalGrade: '95' },
        { courseCode: 'MATH101', title: 'Calculus 1', units: '4', numericalGrade: '88' },
      ];

      const semesterId = 'semester1';
      const result = convertCSVToGradeRecords(csvData, semesterId);

      expect(result.gradeRecords).toHaveLength(2);
      
      const cs101Record = result.gradeRecords.find(r => r.courseCode === 'CS101');
      expect(cs101Record).toBeDefined();
      expect(cs101Record?.units).toBe(3);
      expect(cs101Record?.numericalGrade).toBe(95);
      expect(cs101Record?.letterGrade).toBe('B+');
      expect(cs101Record?.gradePoint).toBe(3.5);
      expect(cs101Record?.qualityPoints).toBe(10.5);
      expect(cs101Record?.semesterId).toBe(semesterId);
    });

    it('should generate unique IDs for each record', () => {
      const csvData = [
        { courseCode: 'CS101', title: 'Computer Science 1', units: '3', numericalGrade: '95' },
        { courseCode: 'MATH101', title: 'Calculus 1', units: '4', numericalGrade: '88' },
      ];

      const result = convertCSVToGradeRecords(csvData, 'semester1');
      
      expect(result.gradeRecords[0].id).toBeDefined();
      expect(result.gradeRecords[1].id).toBeDefined();
      expect(result.gradeRecords[0].id).not.toBe(result.gradeRecords[1].id);
    });

    it('should handle optional semester and year fields', () => {
      const csvData = [
        { 
          courseCode: 'CS101', 
          title: 'Computer Science 1', 
          units: '3', 
          numericalGrade: '95',
          semester: 'first',
          academicYear: '2023-2024'
        },
      ];

      const result = convertCSVToGradeRecords(csvData, 'semester1');
      
      expect(result.gradeRecords[0]).toBeDefined();
      expect(result.gradeRecords[0].courseCode).toBe('CS101');
    });
  });

  describe('parseGradeEntry', () => {
    it('should parse numerical grade string', () => {
      const result = parseGradeEntry('95.5');
      expect(result).toEqual({
        numericalGrade: 95.5,
        letterGrade: 'B+',
        gradePoint: 3.5,
      });
    });

    it('should parse letter grade string', () => {
      const result = parseGradeEntry('A');
      expect(result).toEqual({
        letterGrade: 'A',
        gradePoint: 4.0,
      });
    });

    it('should handle case-insensitive letter grades', () => {
      const result = parseGradeEntry('b+');
      expect(result).toEqual({
        letterGrade: 'B+',
        gradePoint: 3.5,
      });
    });

    it('should throw error for invalid grade', () => {
      expect(() => parseGradeEntry('invalid')).toThrow();
      expect(() => parseGradeEntry('150')).toThrow();
      expect(() => parseGradeEntry('')).toThrow();
    });

    it('should handle incomplete (INC) grades', () => {
      const result = parseGradeEntry('INC');
      expect(result).toEqual({
        letterGrade: 'INC',
        gradePoint: 0,
      });
    });
  });

  describe('Round-trip Export/Import Compatibility', () => {
    const sampleGradeRecords: GradeRecord[] = [
      {
        id: 'grade1',
        courseId: 'course1',
        courseCode: 'CS101',
        courseTitle: 'Computer Science 1',
        units: 3,
        numericalGrade: 95,
        letterGrade: 'A',
        gradePoint: 4.0,
        qualityPoints: 12,
        semesterId: 'semester1',
        notes: 'Great course',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'grade2',
        courseId: 'course2',
        courseCode: 'MATH101',
        courseTitle: 'Calculus 1',
        units: 4,
        numericalGrade: 88,
        letterGrade: 'B+',
        gradePoint: 3.5,
        qualityPoints: 14,
        semesterId: 'semester1',
        notes: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const sampleSemester: SemesterRecord = {
      id: 'semester1',
      yearLevel: 1,
      semesterType: 'first',
      academicYear: '2023-2024',
      grades: ['grade1', 'grade2'],
      totalUnits: 7,
      totalQualityPoints: 26,
      semesterQPI: 3.71,
      isCompleted: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should export and import using Title Case headers (exportForReimport=true)', () => {
      // Export with exportForReimport=true to get minimal format
      const exportedCSV = convertGradeRecordsToCSV(sampleGradeRecords, {
        exportForReimport: true,
        includeHeaders: true,
      });

      // Parse the CSV back
      const parsedData = parseCSV(exportedCSV);

      // Validate structure
      const validation = validateCSVStructure(parsedData);
      expect(validation.isValid).toBe(true);

      // Convert back to grade records
      const importedRecords = convertCSVToGradeRecords(parsedData, 'new-semester');

      // Verify the essential data is preserved
      expect(importedRecords.gradeRecords).toHaveLength(2);

      const cs101Record = importedRecords.gradeRecords.find(r => r.courseCode === 'CS101');
      const math101Record = importedRecords.gradeRecords.find(r => r.courseCode === 'MATH101');

      expect(cs101Record).toBeDefined();
      expect(cs101Record?.courseTitle).toBe('Computer Science 1');
      expect(cs101Record?.units).toBe(3);
      expect(cs101Record?.numericalGrade).toBe(95);
      expect(cs101Record?.notes).toBe('Great course');

      expect(math101Record).toBeDefined();
      expect(math101Record?.courseTitle).toBe('Calculus 1');
      expect(math101Record?.units).toBe(4);
      expect(math101Record?.numericalGrade).toBe(88);
    });

    it('should handle full export format with extra columns', () => {
      // Export with full format (default)
      const semesterMap = new Map<string, SemesterRecord>();
      semesterMap.set('semester1', sampleSemester);

      const exportedCSV = convertGradeRecordsToCSVWithSemesterData(
        sampleGradeRecords,
        semesterMap,
        { includeHeaders: true }
      );

      // Parse the CSV back
      const parsedData = parseCSV(exportedCSV);

      // Validate structure (should handle extra columns gracefully)
      const validation = validateCSVStructure(parsedData);
      expect(validation.isValid).toBe(true);

      // Convert back to grade records
      const importedRecords = convertCSVToGradeRecords(parsedData, 'new-semester');

      // Verify the essential data is preserved
      expect(importedRecords.gradeRecords).toHaveLength(2);

      const cs101Record = importedRecords.gradeRecords.find(r => r.courseCode === 'CS101');
      expect(cs101Record).toBeDefined();
      expect(cs101Record?.courseTitle).toBe('Computer Science 1');
      expect(cs101Record?.units).toBe(3);
      expect(cs101Record?.numericalGrade).toBe(95);
    });

    it('should support old camelCase format for backward compatibility', () => {
      const oldFormatCSV = `courseCode,courseTitle,units,numericalGrade,notes
CS101,Computer Science 1,3,95,Great course
MATH101,Calculus 1,4,88,`;

      // Parse the CSV
      const parsedData = parseCSV(oldFormatCSV);

      // Validate structure
      const validation = validateCSVStructure(parsedData);
      expect(validation.isValid).toBe(true);

      // Convert to grade records
      const importedRecords = convertCSVToGradeRecords(parsedData, 'new-semester');

      expect(importedRecords.gradeRecords).toHaveLength(2);
      expect(importedRecords.gradeRecords[0].courseCode).toBe('CS101');
      expect(importedRecords.gradeRecords[0].courseTitle).toBe('Computer Science 1');
    });

    it('should handle mixed format headers gracefully', () => {
      const mixedFormatCSV = `Course Code,courseTitle,Units,numericalGrade,Notes
CS101,Computer Science 1,3,95,Great course
MATH101,Calculus 1,4,88,`;

      // Parse the CSV
      const parsedData = parseCSV(mixedFormatCSV);

      // Validate structure
      const validation = validateCSVStructure(parsedData);
      expect(validation.isValid).toBe(true);

      // Convert to grade records
      const importedRecords = convertCSVToGradeRecords(parsedData, 'new-semester');

      expect(importedRecords.gradeRecords).toHaveLength(2);
      expect(importedRecords.gradeRecords[0].courseCode).toBe('CS101');
      expect(importedRecords.gradeRecords[0].courseTitle).toBe('Computer Science 1');
    });
  });
});