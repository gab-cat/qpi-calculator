import { describe, it, expect } from 'vitest';
import { 
  convertGradeRecordsToCSV, 
  generateCSVHeaders, 
  formatCSVValue,
  exportAcademicRecordToCSV,
  createDownloadableCSV 
} from '../../src/lib/csv-handler/csv-export';
import type { GradeRecord, SemesterRecord, AcademicRecord } from '../../src/lib/types/academic-types';

describe('CSV Export Handler', () => {
  const mockGradeRecords: GradeRecord[] = [
    {
      id: '1',
      courseId: 'course1',
      courseCode: 'CS101',
      courseTitle: 'Computer Science 1',
      units: 3,
      numericalGrade: 95,
      letterGrade: 'B+',
      gradePoint: 3.5,
      qualityPoints: 10.5,
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
      qualityPoints: 10.0,
      semesterId: 'sem1',
      notes: 'Difficult course',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  describe('generateCSVHeaders', () => {
    it('should generate standard CSV headers', () => {
      const headers = generateCSVHeaders();
      expect(headers).toEqual([
        'Course Code',
        'Course Title',
        'Units',
        'Numerical Grade',
        'Letter Grade',
        'Grade Point',
        'Quality Points',
        'Semester',
        'Academic Year',
        'Notes',
      ]);
    });

    it('should generate custom headers when provided', () => {
      const customHeaders = ['courseCode', 'title', 'grade'];
      const headers = generateCSVHeaders(customHeaders);
      expect(headers).toEqual(customHeaders);
    });
  });

  describe('formatCSVValue', () => {
    it('should format string values correctly', () => {
      expect(formatCSVValue('Simple string')).toBe('Simple string');
      expect(formatCSVValue('String with, comma')).toBe('"String with, comma"');
      expect(formatCSVValue('String with "quotes"')).toBe('"String with ""quotes"""');
      expect(formatCSVValue('String with\nnewline')).toBe('"String with\nnewline"');
    });

    it('should format number values correctly', () => {
      expect(formatCSVValue(42)).toBe('42');
      expect(formatCSVValue(3.14)).toBe('3.14');
      expect(formatCSVValue(0)).toBe('0');
    });

    it('should handle null and undefined values', () => {
      expect(formatCSVValue(null)).toBe('');
      expect(formatCSVValue(undefined)).toBe('');
    });

    it('should handle boolean values', () => {
      // @ts-expect-error testing invalid input
      expect(formatCSVValue(true)).toBe('true');
      // @ts-expect-error testing invalid input
      expect(formatCSVValue(false)).toBe('false');
    });
  });

  describe('convertGradeRecordsToCSV', () => {
    it('should convert grade records to CSV string', () => {
      const csv = convertGradeRecordsToCSV(mockGradeRecords);
      const lines = csv.split('\n');
      
      // Check header line
      expect(lines[0]).toBe('Course Code,Course Title,Units,Numerical Grade,Letter Grade,Grade Point,Quality Points,Semester,Academic Year,Notes');
      
      // Check data lines
      expect(lines[1]).toContain('CS101');
      expect(lines[1]).toContain('Computer Science 1');
      expect(lines[1]).toContain('3');
      expect(lines[1]).toContain('95');
      expect(lines[1]).toContain('B+');
      expect(lines[1]).toContain('3.5');
      expect(lines[1]).toContain('10.5');
      
      expect(lines[2]).toContain('MATH101');
      expect(lines[2]).toContain('Difficult course');
    });

    it('should handle empty grade records', () => {
      const csv = convertGradeRecordsToCSV([]);
      const lines = csv.split('\n');
      
      expect(lines).toHaveLength(1); // Only header
      expect(lines[0]).toBe('Course Code,Course Title,Units,Numerical Grade,Letter Grade,Grade Point,Quality Points,Semester,Academic Year,Notes');
    });

    it('should include semester metadata when provided', () => {
      const semesterMetadata = {
        semester: 'first',
        academicYear: '2023-2024',
      };
      
      const csv = convertGradeRecordsToCSV(mockGradeRecords, semesterMetadata);
      const lines = csv.split('\n');
      
      expect(lines[1]).toContain('first');
      expect(lines[1]).toContain('2023-2024');
      expect(lines[2]).toContain('first');
      expect(lines[2]).toContain('2023-2024');
    });
  });

  describe('exportAcademicRecordToCSV', () => {
    const mockSemesters: SemesterRecord[] = [
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
    ];

    const mockAcademicRecord: AcademicRecord = {
      id: 'main',
      semesters: ['sem1'],
      totalUnits: 7,
      totalQualityPoints: 20.5,
      cumulativeQPI: 2.93,
      yearlyQPIs: [{
        academicYear: '2023-2024',
        firstSemQPI: 2.93,
        yearlyQPI: 2.93,
      }],
      configuration: {
        totalYears: 4,
        includesSummer: false,
      },
      lastCalculated: Date.now(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should export complete academic record to CSV', () => {
      const csv = exportAcademicRecordToCSV(mockAcademicRecord, mockSemesters, mockGradeRecords);
      
      expect(csv).toContain('Course Code,Course Title,Units');
      expect(csv).toContain('CS101');
      expect(csv).toContain('MATH101');
      expect(csv).toContain('first'); // semester type
      expect(csv).toContain('2023-2024'); // academic year
    });

    it('should include summary statistics when requested', () => {
      const csv = exportAcademicRecordToCSV(
        mockAcademicRecord, 
        mockSemesters, 
        mockGradeRecords, 
        { includeSummary: true }
      );
      
      expect(csv).toContain('Total Units: 7');
      expect(csv).toContain('Cumulative QPI: 2.93');
    });

    it('should handle export for specific semesters only', () => {
      const options = {
        semesterFilter: ['sem1'],
      };
      
      const csv = exportAcademicRecordToCSV(mockAcademicRecord, mockSemesters, mockGradeRecords, options);
      
      expect(csv).toContain('CS101');
      expect(csv).toContain('MATH101');
    });
  });

  describe('createDownloadableCSV', () => {
    it('should create downloadable blob from CSV string', () => {
      const csvContent = 'courseCode,title,units\nCS101,Computer Science,3';
      const filename = 'grades.csv';
      
      const result = createDownloadableCSV(csvContent, filename);
      
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('text/csv');
      expect(result.url).toContain('blob:');
      expect(result.filename).toBe(filename);
    });

    it('should generate default filename with timestamp', () => {
      const csvContent = 'courseCode,title,units\nCS101,Computer Science,3';
      
      const result = createDownloadableCSV(csvContent);
      
      expect(result.filename).toMatch(/grades_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv/);
    });

    it('should handle empty CSV content', () => {
      const result = createDownloadableCSV('');
      
      expect(result.blob.size).toBeGreaterThan(0); // Still creates blob
      expect(result.filename).toBeDefined();
    });
  });

  describe('CSV format validation', () => {
    it('should produce valid CSV that can be re-imported', () => {
      const csv = convertGradeRecordsToCSV(mockGradeRecords);
      const lines = csv.split('\n');
      
      // Check that we have the expected number of lines (header + data rows)
      expect(lines.length).toBeGreaterThan(1);
      
      // Check that each line has the same number of commas (indicating proper field count)
      const headerCommaCount = (lines[0].match(/,/g) || []).length;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) { // Skip empty lines
          const lineCommaCount = (lines[i].match(/,/g) || []).length;
          expect(lineCommaCount).toBe(headerCommaCount);
        }
      }
    });

    it('should escape special characters correctly', () => {
      const recordWithSpecialChars: GradeRecord = {
        ...mockGradeRecords[0],
        courseTitle: 'Course with, comma and "quotes"',
        notes: 'Notes with tab and carriage return',
      };
      
      const csv = convertGradeRecordsToCSV([recordWithSpecialChars]);
      
      // Should not break CSV format
      const lines = csv.split('\n').filter(line => line.trim());
      expect(lines).toHaveLength(2); // Header + 1 data row
      expect(lines[1]).toContain('"Course with, comma and ""quotes"""');
    });
  });
});