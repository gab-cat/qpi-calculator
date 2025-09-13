import { describe, it, expect, beforeEach } from 'vitest';
import { parseCSV } from '../../src/lib/csv-handler/csv-import';

// Mock the CalculatorPage's handleImportSuccess logic
// This test verifies that semester keys are correctly generated and mapped

describe('CSV Import Semester Fix', () => {
  const sampleCSVContent = `Course Code,Course Title,Units,Numerical Grade,Notes,Semester,Academic Year
ENGS101,Purposive Communication,3,99,,first,2021
PFIT101,Movement Competency Training,2,100,,first,2021
PHIS101,Understanding the Self,3,90,,first,2021`;

  it('should correctly parse CSV with semester and academic year information', () => {
    const csvData = parseCSV(sampleCSVContent);
    
    expect(csvData).toHaveLength(3);
    expect(csvData[0]).toEqual({
      'Course Code': 'ENGS101',
      'Course Title': 'Purposive Communication',
      'Units': '3',
      'Numerical Grade': '99',
      'Notes': '',
      'Semester': 'first',
      'Academic Year': '2021'
    });
  });

  it('should generate consistent semester group keys', () => {
    const csvData = parseCSV(sampleCSVContent);
    
    // Simulate the semester grouping logic from CSVImporter
    const semesterGroups: Record<string, any[]> = {};
    
    csvData.forEach(row => {
      const semester = row['Semester'].toLowerCase().trim();
      let academicYear = row['Academic Year'];
      
      // Normalize academic year format (handle both "2021" and "2020-2021")
      if (academicYear && academicYear.length === 4 && /^\d{4}$/.test(academicYear)) {
        const year = parseInt(academicYear);
        academicYear = `${year - 1}-${year}`;
      }
      
      const key = `${academicYear}-${semester}`;
      
      if (!semesterGroups[key]) {
        semesterGroups[key] = [];
      }
      semesterGroups[key].push(row);
    });
    
    // Should have one semester group for "2020-2021-first"
    expect(Object.keys(semesterGroups)).toHaveLength(1);
    expect(Object.keys(semesterGroups)[0]).toBe('2020-2021-first');
    expect(semesterGroups['2020-2021-first']).toHaveLength(3);
  });

  it('should simulate the fixed semester ID mapping logic', () => {
    const csvData = parseCSV(sampleCSVContent);
    
    // Simulate the CalculatorPage's semester creation logic
    const createdSemesterIds: Record<string, string> = {};
    const semesterGroups: Record<string, any[]> = {};
    
    // Group data by semester/academic year
    csvData.forEach(row => {
      const semester = row['Semester'].toLowerCase().trim();
      let academicYear = row['Academic Year'];
      
      if (academicYear && academicYear.length === 4 && /^\d{4}$/.test(academicYear)) {
        const year = parseInt(academicYear);
        academicYear = `${year - 1}-${year}`;
      }
      
      const key = `${academicYear}-${semester}`;
      
      if (!semesterGroups[key]) {
        semesterGroups[key] = [];
      }
      semesterGroups[key].push(row);
    });
    
    // Simulate creating semesters and getting IDs (like the fixed addSemester function)
    Object.entries(semesterGroups).forEach(([key, items]) => {
      if (items.length > 0) {
        // Simulate the addSemester function returning an ID
        const semesterId = `semester-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        createdSemesterIds[key] = semesterId;
      }
    });
    
    // Simulate mapping grade records to semester IDs
    const gradeRecords = csvData.map(row => ({
      courseCode: row['Course Code'],
      courseTitle: row['Course Title'],
      units: parseInt(row['Units']),
      numericalGrade: parseInt(row['Numerical Grade']),
      semesterId: '', // Will be set below
    }));
    
    // Update grade records with correct semester IDs (the fixed logic)
    const updatedGradeRecords = gradeRecords.map(record => {
      const semesterKey = Object.keys(semesterGroups).find(key => {
        const items = semesterGroups[key];
        return items.some(item =>
          item['Course Code'] === record.courseCode &&
          item['Course Title'] === record.courseTitle
        );
      });
      
      const semesterId = semesterKey ? createdSemesterIds[semesterKey] : '';
      
      return {
        ...record,
        semesterId,
      };
    }).filter(record => record.semesterId); // Only include records with valid semester IDs
    
    // All records should have valid semester IDs now
    expect(updatedGradeRecords).toHaveLength(3);
    expect(updatedGradeRecords.every(record => record.semesterId.length > 0)).toBe(true);
    
    // All records should have the same semester ID (since they're in the same semester)
    const uniqueSemesterIds = [...new Set(updatedGradeRecords.map(r => r.semesterId))];
    expect(uniqueSemesterIds).toHaveLength(1);
  });
});

