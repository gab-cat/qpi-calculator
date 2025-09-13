// CSV export utilities for academic data

import type { GradeRecord, SemesterRecord, AcademicRecord } from '../types/academic-types';

export interface CSVExportOptions {
  includeHeaders?: boolean;
  includeNotes?: boolean;
  includeCourseId?: boolean;
  customDelimiter?: string;
  exportForReimport?: boolean; // Export only essential fields for re-import compatibility
}

export interface SemesterMetadata {
  semester: string;
  academicYear: string;
}

/**
 * Convert grade records to CSV format with semester metadata
 */
export function convertGradeRecordsToCSVWithSemesterData(
  gradeRecords: GradeRecord[],
  semesterMap: Map<string, SemesterRecord>,
  options: CSVExportOptions = {}
): string {
  const {
    includeHeaders = true,
    customDelimiter = ',',
    exportForReimport = false,
  } = options;

  if (gradeRecords.length === 0) {
    return includeHeaders ? generateCSVHeaders(undefined, exportForReimport).join(customDelimiter) : '';
  }

  const lines: string[] = [];

  // Add headers if requested
  if (includeHeaders) {
    const headers = generateCSVHeaders(undefined, exportForReimport);
    lines.push(headers.join(customDelimiter));
  }

  // Add data rows
  for (const record of gradeRecords) {
    const semester = semesterMap.get(record.semesterId);
    const row = buildCSVRowWithSemesterData(record, semester, exportForReimport);
    const formattedRow = row.map((value: string | number) => formatCSVValue(value, customDelimiter));
    lines.push(formattedRow.join(customDelimiter));
  }

  return lines.join('\n');
}

/**
 * Convert grade records to CSV format
 */
export function convertGradeRecordsToCSV(
  gradeRecords: GradeRecord[],
  optionsOrMetadata: CSVExportOptions | SemesterMetadata = {}
): string {
  // Check if second parameter is semester metadata
  const isSemesterMetadata = 'semester' in optionsOrMetadata && 'academicYear' in optionsOrMetadata;

  const options: CSVExportOptions = isSemesterMetadata ? {} : optionsOrMetadata as CSVExportOptions;
  const semesterMetadata: SemesterMetadata | undefined = isSemesterMetadata ? optionsOrMetadata as SemesterMetadata : undefined;

  const {
    includeHeaders = true,
    customDelimiter = ',',
    exportForReimport = false,
  } = options;

  if (gradeRecords.length === 0) {
    return includeHeaders ? generateCSVHeaders(undefined, exportForReimport).join(customDelimiter) : '';
  }

  const lines: string[] = [];

  // Add headers if requested
  if (includeHeaders) {
    const headers = generateCSVHeaders(undefined, exportForReimport);
    lines.push(headers.join(customDelimiter));
  }

  // Add data rows - use semester metadata if provided
  for (const record of gradeRecords) {
    const mockSemester = semesterMetadata ? {
      id: '',
      yearLevel: 1,
      semesterType: semesterMetadata.semester as 'first' | 'second' | 'summer',
      academicYear: semesterMetadata.academicYear,
      grades: [],
      totalUnits: 0,
      totalQualityPoints: 0,
      semesterQPI: 0,
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } : undefined;

    const row = buildCSVRowWithSemesterData(record, mockSemester, exportForReimport);
    const formattedRow = row.map((value: string | number) => formatCSVValue(value, customDelimiter));
    lines.push(formattedRow.join(customDelimiter));
  }

  return lines.join('\n');
}

/**
 * Convert semester record to CSV format
 */
export function convertSemesterToCSV(
  semester: SemesterRecord,
  gradeRecords: GradeRecord[],
  options: CSVExportOptions = {}
): string {
  // Filter grade records for this semester
  const semesterGrades = gradeRecords.filter(grade => 
    semester.grades.includes(grade.id)
  );
  return convertGradeRecordsToCSV(semesterGrades, options);
}

/**
 * Convert academic record to CSV format (all grades)
 */
export function convertAcademicRecordToCSV(
  academicRecord: AcademicRecord,
  gradeRecords: GradeRecord[],
  options: CSVExportOptions = {}
): string {
  // Filter grade records that belong to this academic record's semesters
  const allGrades = gradeRecords.filter(grade => 
    academicRecord.semesters.some(semesterId => 
      grade.semesterId === semesterId
    )
  );

  return convertGradeRecordsToCSV(allGrades, options);
}

/**
 * Export complete academic record to CSV (test-compatible function)
 */
export function exportAcademicRecordToCSV(
  academicRecord: AcademicRecord,
  semesterRecords: SemesterRecord[],
  gradeRecords: GradeRecord[],
  options: CSVExportOptions & { 
    includeSummary?: boolean;
    semesterFilter?: string[];
  } = {}
): string {
  const {
    includeSummary = false,
    semesterFilter,
    ...csvOptions
  } = options;

  // Create a map for quick semester lookup
  const semesterMap = new Map<string, SemesterRecord>();
  for (const semester of semesterRecords) {
    semesterMap.set(semester.id, semester);
  }

  // Filter grade records by semester if specified
  let filteredGrades = gradeRecords;
  if (semesterFilter) {
    filteredGrades = gradeRecords.filter(grade => 
      semesterFilter.includes(grade.semesterId)
    );
  } else {
    // Filter grade records that belong to this academic record's semesters
    filteredGrades = gradeRecords.filter(grade => 
      academicRecord.semesters.some(semesterId => 
        grade.semesterId === semesterId
      )
    );
  }

  // Convert to enriched CSV format
  let csvContent = convertGradeRecordsToCSVWithSemesterData(
    filteredGrades,
    semesterMap,
    csvOptions
  );

  // If exporting for re-import, we don't want the summary section
  if (csvOptions.exportForReimport && includeSummary) {
    return csvContent;
  }

  if (includeSummary) {
    const summaryLines = [];
    summaryLines.push('');
    summaryLines.push('=== ACADEMIC SUMMARY ===');
    summaryLines.push(`Total Units: ${academicRecord.totalUnits || 0}`);
    summaryLines.push(`Cumulative QPI: ${academicRecord.cumulativeQPI?.toFixed(2) || 'N/A'}`);
    summaryLines.push(`Total Years: ${academicRecord.configuration.totalYears}`);
    summaryLines.push(`Includes Summer: ${academicRecord.configuration.includesSummer ? 'Yes' : 'No'}`);
    
    csvContent += '\n' + summaryLines.join('\n');
  }

  return csvContent;
}

/**
 * Format a single CSV value, handling quotes and special characters
 */
export function formatCSVValue(value: string | number | null | undefined, delimiter = ','): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // Check if value needs quoting (contains delimiter, quotes, or newlines)
  const needsQuotes = stringValue.includes(delimiter) || 
                     stringValue.includes('"') ||
                     stringValue.includes('\n') ||
                     stringValue.includes('\r') ||
                     stringValue.includes('\t');

  if (!needsQuotes) {
    return stringValue;
  }

  // Escape quotes by doubling them, preserve literal newlines
  const escapedValue = stringValue.replace(/"/g, '""');
  return `"${escapedValue}"`;
}

/**
 * Create a downloadable CSV blob with proper headers
 */
export function createDownloadableCSV(
  csvContent: string,
  filename?: string
): { blob: Blob; filename: string; url: string } {
  // Add BOM for proper Excel UTF-8 handling
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv',
  });

  const url = URL.createObjectURL(blob);
  
  // Generate timestamped filename if not provided
  let finalFilename: string;
  if (filename) {
    finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  } else {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timePart = now.toISOString().slice(11, 19).replace(/:/g, '-'); // HH-MM-SS
    finalFilename = `grades_${datePart}_${timePart}.csv`;
  }

  return {
    blob,
    filename: finalFilename,
    url,
  };
}

/**
 * Trigger download of CSV file in browser
 */
export function downloadCSV(csvContent: string, filename = 'grades.csv'): void {
  const { url, filename: finalFilename } = createDownloadableCSV(csvContent, filename);

  // Create temporary download link
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the object URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Get CSV headers based on options
 */
export function getCSVHeaders(includeNotes: boolean, includeCourseId: boolean): string[] {
  const headers = [
    'courseCode',
    'courseTitle', // Match test expectation
    'units',
    'numericalGrade',
    'letterGrade',
    'gradePoint',
    'qualityPoints',
  ];

  if (includeCourseId) {
    headers.unshift('courseId');
  }

  if (includeNotes) {
    headers.push('notes');
  }

  return headers;
}

/**
 * Generate CSV headers (public export for tests)
 */
export function generateCSVHeaders(customHeaders?: string[], exportForReimport = false): string[] {
  if (customHeaders) {
    return [...customHeaders];
  }

  if (exportForReimport) {
    // Use Title Case headers that import expects, but include semester info for context
    return [
      'Course Code',
      'Course Title',
      'Units',
      'Numerical Grade',
      'Notes',
      'Semester',
      'Academic Year',
      'Year Level',
    ];
  }

  // Full export with all fields
  return [
    'Course Code',
    'Course Title',
    'Units',
    'Numerical Grade',
    'Letter Grade',
    'Grade Point',
    'Quality Points',
    'Semester',
    'Academic Year',
    'Year Level',
    'Notes',
  ];
}

/**
 * Build CSV row data for a grade record with semester metadata
 */
function buildCSVRowWithSemesterData(
  record: GradeRecord,
  semester?: SemesterRecord,
  exportForReimport = false
): (string | number)[] {
  if (exportForReimport) {
    // Export essential fields for re-import compatibility, including semester context
    return [
      record.courseCode,
      record.courseTitle,
      record.units,
      record.numericalGrade ?? '',
      record.notes ?? '',
      semester?.semesterType ?? '',
      semester?.academicYear ?? '',
      semester?.yearLevel ?? '',
    ];
  }

  // Full export with all calculated fields
  return [
    record.courseCode,
    record.courseTitle,
    record.units,
    record.numericalGrade ?? '',
    record.letterGrade ?? '',
    record.gradePoint ?? '',
    record.qualityPoints ?? '',
    semester?.semesterType ?? '',
    semester?.academicYear ?? '',
    semester?.yearLevel ?? '',
    record.notes ?? '',
  ];
}

/**
 * Build CSV row data for a grade record
 */
export function buildCSVRow(
  record: GradeRecord, 
  includeNotes: boolean, 
  includeCourseId: boolean
): (string | number)[] {
  const row: (string | number)[] = [
    record.courseCode,
    record.courseTitle,
    record.units,
    record.numericalGrade ?? '',
    record.letterGrade ?? '',
    record.gradePoint ?? '',
    record.qualityPoints ?? '',
  ];

  if (includeCourseId) {
    row.unshift(record.courseId);
  }

  if (includeNotes) {
    row.push(record.notes ?? '');
  }

  return row;
}

/**
 * Generate filename with timestamp
 */
export function generateCSVFilename(baseName = 'grades', extension = 'csv'): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timePart = now.toISOString().slice(11, 19).replace(/:/g, '-'); // HH-MM-SS
  return `${baseName}_${datePart}_${timePart}.${extension}`;
}

/**
 * Export semester summary with QPI information
 */
export function exportSemesterSummary(
  semester: SemesterRecord, 
  gradeRecords: GradeRecord[]
): string {
  const lines: string[] = [];
  
  // Get semester grades
  const semesterGrades = gradeRecords.filter(grade => 
    semester.grades.includes(grade.id)
  );
  
  // Semester header info
  lines.push(`Semester,${semester.semesterType}`);
  lines.push(`Academic Year,${semester.academicYear || 'N/A'}`);
  lines.push(`Year Level,${semester.yearLevel}`);
  lines.push(`Total Units,${semester.totalUnits || 0}`);
  lines.push(`QPI,${semester.semesterQPI?.toFixed(2) || 'N/A'}`);
  lines.push('');

  // Grade records
  if (semesterGrades.length > 0) {
    lines.push('Course Code,Course Title,Units,Grade,Grade Point,Quality Points');
    
    for (const record of semesterGrades) {
      const row = [
        record.courseCode,
        record.courseTitle,
        record.units,
        record.letterGrade ?? '',
        record.gradePoint ?? '',
        record.qualityPoints ?? ''
      ];
      
      lines.push(row.map(v => formatCSVValue(v)).join(','));
    }
  }

  return lines.join('\n');
}