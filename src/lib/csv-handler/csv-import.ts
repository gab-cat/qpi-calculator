// CSV import utilities for academic data

import type { GradeRecord } from '../types/academic-types';
import { convertNumericalToLetter, convertNumericalToGradePoint, isValidNumericalGrade, convertLetterToGradePoint } from '../calculations/grade-scale';
import { calculateQualityPoints } from '../calculations/qpi-calculator';

export interface CSVRow {
  [key: string]: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ParsedGradeEntry {
  numericalGrade?: number;
  letterGrade: string;
  gradePoint: number;
}

/**
 * Parse CSV content into array of objects
 */
export function parseCSV(csvContent: string): CSVRow[] {
  if (!csvContent.trim()) {
    return [];
  }

  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    return []; // No data rows
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const data: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: CSVRow = {};
    
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    
    data.push(row);
  }

  return data;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field delimiter
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Validate CSV structure and data types
 */
export function validateCSVStructure(data: CSVRow[]): ValidationResult {
  const errors: string[] = [];

  if (data.length === 0) {
    return { isValid: true, errors: [] };
  }

  // Check required columns - support both old and new formats
  const firstRow = data[0];
  const requiredColumnMappings = [
    { old: 'courseCode', new: 'Course Code', alt: 'courseCode' },
    { old: 'courseTitle', new: 'Course Title', alt: 'title' },
    { old: 'units', new: 'Units', alt: 'units' },
    { old: 'numericalGrade', new: 'Numerical Grade', alt: 'numericalGrade' }
  ];

  // Optional columns for semester context
  const optionalColumnMappings = [
    { old: 'semester', new: 'Semester', alt: 'semester' },
    { old: 'academicYear', new: 'Academic Year', alt: 'academicYear' },
    { old: 'yearLevel', new: 'Year Level', alt: 'yearLevel' }
  ];

  const foundColumns: { [key: string]: string } = {};

  // Find which format is being used for required columns
  for (const mapping of requiredColumnMappings) {
    if (mapping.new in firstRow) {
      foundColumns[mapping.old] = mapping.new;
    } else if (mapping.old in firstRow) {
      foundColumns[mapping.old] = mapping.old;
    } else if (mapping.alt && mapping.alt in firstRow) {
      foundColumns[mapping.old] = mapping.alt;
    } else {
      errors.push(`Missing required column: ${mapping.new}, ${mapping.old}, or ${mapping.alt}`);
    }
  }

  // Find optional columns
  for (const mapping of optionalColumnMappings) {
    if (mapping.new in firstRow) {
      foundColumns[mapping.old] = mapping.new;
    } else if (mapping.old in firstRow) {
      foundColumns[mapping.old] = mapping.old;
    } else if (mapping.alt && mapping.alt in firstRow) {
      foundColumns[mapping.old] = mapping.alt;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Validate data in each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowIndex = i + 1;

    // Get actual column values using the mapped column names
    const courseCode = row[foundColumns.courseCode];
    const title = row[foundColumns.courseTitle];
    const unitsValue = row[foundColumns.units];
    const numericalGradeValue = row[foundColumns.numericalGrade];
    const yearLevelValue = foundColumns.yearLevel ? row[foundColumns.yearLevel] : undefined;

    // Validate units
    const units = parseFloat(unitsValue);
    if (isNaN(units) || units <= 0 || units > 6) {
      errors.push(`Row ${rowIndex}: Invalid units value "${unitsValue}". Must be between 0.5 and 6.`);
    }

    // Validate numerical grade
    const grade = parseFloat(numericalGradeValue);
    if (isNaN(grade) || !isValidNumericalGrade(grade)) {
      errors.push(`Row ${rowIndex}: Invalid numerical grade value "${numericalGradeValue}". Must be between 0 and 100.`);
    }

    // Validate course code
    if (!courseCode || courseCode.length < 3 || courseCode.length > 20) {
      errors.push(`Row ${rowIndex}: Invalid course code "${courseCode}". Must be 3-20 characters.`);
    }

    // Validate title
    if (!title || title.length < 1 || title.length > 200) {
      errors.push(`Row ${rowIndex}: Invalid course title "${title}". Must be 1-200 characters.`);
    }

    // Validate year level if present
    if (yearLevelValue !== undefined && yearLevelValue !== '') {
      const yearLevel = parseInt(yearLevelValue);
      if (isNaN(yearLevel) || yearLevel < 1 || yearLevel > 5) {
        errors.push(`Row ${rowIndex}: Invalid year level "${yearLevelValue}". Must be between 1 and 5.`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Convert CSV data to grade records with semester context
 */
export function convertCSVToGradeRecords(
  csvData: CSVRow[],
  semesterId: string
): {
  gradeRecords: GradeRecord[];
  semesterGroups: Record<string, Array<{
    row: number;
    courseCode: string;
    courseTitle: string;
    units: number;
    grade?: number;
    semester: string;
    academicYear: string;
    yearLevel?: number;
    isValid: boolean;
    warnings: string[];
  }>>;
} {
  const gradeRecords: GradeRecord[] = [];
  const semesterGroups: Record<string, Array<{
    row: number;
    courseCode: string;
    courseTitle: string;
    units: number;
    grade?: number;
    semester: string;
    academicYear: string;
    yearLevel?: number;
    isValid: boolean;
    warnings: string[];
  }>> = {};

  // Detect column format from first row
  const firstRow = csvData[0];
  const columnMappings = {
    courseCode: 'Course Code' in firstRow ? 'Course Code' : ('courseCode' in firstRow ? 'courseCode' : 'courseCode'),
    courseTitle: 'Course Title' in firstRow ? 'Course Title' : ('courseTitle' in firstRow ? 'courseTitle' : 'title'),
    units: 'Units' in firstRow ? 'Units' : ('units' in firstRow ? 'units' : 'units'),
    numericalGrade: 'Numerical Grade' in firstRow ? 'Numerical Grade' : ('numericalGrade' in firstRow ? 'numericalGrade' : 'numericalGrade'),
    courseId: 'courseId' in firstRow ? 'courseId' : 'courseId', // This might not exist in export
    notes: 'Notes' in firstRow ? 'Notes' : ('notes' in firstRow ? 'notes' : 'notes'), // This might not exist in simple import format
    semester: 'Semester' in firstRow ? 'Semester' : ('semester' in firstRow ? 'semester' : null), // Optional semester info
    academicYear: 'Academic Year' in firstRow ? 'Academic Year' : ('academicYear' in firstRow ? 'academicYear' : null), // Optional academic year info
    yearLevel: 'Year Level' in firstRow ? 'Year Level' : ('yearLevel' in firstRow ? 'yearLevel' : null), // Optional year level info
  };

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const units = parseFloat(row[columnMappings.units]);
    const numericalGrade = parseFloat(row[columnMappings.numericalGrade]);
    const yearLevelValue = columnMappings.yearLevel ? row[columnMappings.yearLevel] : undefined;
    const yearLevel = yearLevelValue ? parseInt(yearLevelValue) : undefined;

    // Calculate derived values
    const letterGrade = convertNumericalToLetter(numericalGrade);
    const gradePoint = convertNumericalToGradePoint(numericalGrade);
    const qualityPoints = calculateQualityPoints(units, gradePoint);

    // Extract semester context from CSV
    const csvSemester = columnMappings.semester ? row[columnMappings.semester] : '';
    const csvAcademicYear = columnMappings.academicYear ? row[columnMappings.academicYear] : '';
    
    // Create semester key for grouping
    const semesterKey = `${csvAcademicYear}-${csvSemester}`;
    
    // Add to semester groups for processing
    if (!semesterGroups[semesterKey]) {
      semesterGroups[semesterKey] = [];
    }
    
    semesterGroups[semesterKey].push({
      row: i + 1,
      courseCode: row[columnMappings.courseCode],
      courseTitle: row[columnMappings.courseTitle],
      units,
      grade: numericalGrade,
      semester: csvSemester,
      academicYear: csvAcademicYear,
      yearLevel,
      isValid: true,
      warnings: []
    });

    // Use semester info from CSV if available, otherwise use provided semesterId
    let finalSemesterId = semesterId;
    if (csvSemester && csvAcademicYear) {
      // For now, keep using the provided semesterId
      // The semester creation will be handled by the caller
      finalSemesterId = semesterId;
    }

    const gradeRecord: GradeRecord = {
      id: generateId(),
      courseId: row[columnMappings.courseId] || generateId(), // Use provided ID or generate one
      courseCode: row[columnMappings.courseCode],
      courseTitle: row[columnMappings.courseTitle],
      units,
      numericalGrade,
      letterGrade,
      gradePoint,
      qualityPoints,
      semesterId: finalSemesterId,
      notes: row[columnMappings.notes],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    gradeRecords.push(gradeRecord);
  }

  return { gradeRecords, semesterGroups };
}

/**
 * Parse grade entry (can be numerical or letter grade)
 */
export function parseGradeEntry(gradeInput: string): ParsedGradeEntry {
  const trimmed = gradeInput.trim();
  
  if (!trimmed) {
    throw new Error('Grade input cannot be empty');
  }

  // Handle special cases
  if (trimmed.toUpperCase() === 'INC') {
    return {
      letterGrade: 'INC',
      gradePoint: 0,
    };
  }

  // Try to parse as numerical grade first
  const numericalValue = parseFloat(trimmed);
  if (!isNaN(numericalValue)) {
    if (!isValidNumericalGrade(numericalValue)) {
      throw new Error(`Invalid numerical grade: ${numericalValue}. Must be between 0 and 100.`);
    }

    return {
      numericalGrade: numericalValue,
      letterGrade: convertNumericalToLetter(numericalValue),
      gradePoint: convertNumericalToGradePoint(numericalValue),
    };
  }

  // Try to parse as letter grade
  try {
    const gradePoint = convertLetterToGradePoint(trimmed);
    return {
      letterGrade: trimmed.toUpperCase(),
      gradePoint,
    };
  } catch {
    throw new Error(`Invalid grade input: "${trimmed}". Must be a numerical grade (0-100) or letter grade (A, B+, B, C+, C, D+, D, F).`);
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}