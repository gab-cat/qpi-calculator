// QPI calculation utilities

import type { GradeRecord, SemesterRecord } from '../types/academic-types';

/**
 * Calculate QPI for a list of grade records
 * QPI = Total Quality Points / Total Units
 */
export function calculateQPI(gradeRecords: GradeRecord[]): number {
  if (gradeRecords.length === 0) {
    return 0;
  }

  let totalUnits = 0;
  let totalQualityPoints = 0;

  for (const record of gradeRecords) {
    if (record.qualityPoints !== undefined && record.qualityPoints > 0) {
      totalUnits += record.units;
      totalQualityPoints += record.qualityPoints;
    }
  }

  if (totalUnits === 0) {
    return 0;
  }

  return totalQualityPoints / totalUnits;
}

/**
 * Calculate QPI for a single semester
 */
export function calculateSemesterQPI(semesterRecord: SemesterRecord): number {
  if (!semesterRecord.totalUnits || semesterRecord.totalUnits === 0) {
    return 0;
  }

  if (!semesterRecord.totalQualityPoints) {
    return 0;
  }

  return semesterRecord.totalQualityPoints / semesterRecord.totalUnits;
}

/**
 * Calculate cumulative QPI across multiple semesters
 */
export function calculateCumulativeQPI(semesters: SemesterRecord[]): number {
  if (semesters.length === 0) {
    return 0;
  }

  let totalUnits = 0;
  let totalQualityPoints = 0;

  for (const semester of semesters) {
    if (semester.totalUnits && semester.totalQualityPoints) {
      totalUnits += semester.totalUnits;
      totalQualityPoints += semester.totalQualityPoints;
    }
  }

  if (totalUnits === 0) {
    return 0;
  }

  return totalQualityPoints / totalUnits;
}

/**
 * Calculate yearly QPI from semester QPIs
 * Supports simple average or weighted average with units
 */
export function calculateYearlyQPI(
  firstSemQPI: number,
  secondSemQPI?: number,
  summerQPI?: number,
  firstSemUnits?: number,
  secondSemUnits?: number,
  summerUnits?: number
): number {
  // If units are provided, calculate weighted average
  if (firstSemUnits !== undefined && secondSemUnits !== undefined) {
    let totalWeightedPoints = firstSemQPI * firstSemUnits;
    let totalUnits = firstSemUnits;

    if (secondSemQPI !== undefined) {
      totalWeightedPoints += secondSemQPI * secondSemUnits!;
      totalUnits += secondSemUnits!;
    }

    if (summerQPI !== undefined && summerUnits !== undefined) {
      totalWeightedPoints += summerQPI * summerUnits;
      totalUnits += summerUnits;
    }

    return totalUnits > 0 ? totalWeightedPoints / totalUnits : 0;
  }

  // Simple average of semester QPIs
  const qpis = [firstSemQPI];
  if (secondSemQPI !== undefined) {
    qpis.push(secondSemQPI);
  }
  if (summerQPI !== undefined) {
    qpis.push(summerQPI);
  }

  return qpis.reduce((sum, qpi) => sum + qpi, 0) / qpis.length;
}

/**
 * Calculate quality points for a single grade
 */
export function calculateQualityPoints(units: number, gradePoint: number): number {
  return units * gradePoint;
}

/**
 * Update grade record with calculated values
 */
export function updateGradeCalculations(
  gradeRecord: GradeRecord,
  numericalGrade: number,
  letterGrade: string,
  gradePoint: number
): GradeRecord {
  const qualityPoints = calculateQualityPoints(gradeRecord.units, gradePoint);

  return {
    ...gradeRecord,
    numericalGrade,
    letterGrade,
    gradePoint,
    qualityPoints,
    updatedAt: Date.now(),
  };
}

/**
 * Calculate semester totals from grade records
 */
export function calculateSemesterTotals(gradeRecords: GradeRecord[]): {
  totalUnits: number;
  totalQualityPoints: number;
  semesterQPI: number;
} {
  let totalUnits = 0;
  let totalQualityPoints = 0;

  for (const record of gradeRecords) {
    totalUnits += record.units;
    if (record.qualityPoints) {
      totalQualityPoints += record.qualityPoints;
    }
  }

  const semesterQPI = totalUnits > 0 ? totalQualityPoints / totalUnits : 0;

  return {
    totalUnits,
    totalQualityPoints,
    semesterQPI,
  };
}

/**
 * Update semester record with calculated values
 */
export function updateSemesterCalculations(
  semesterRecord: SemesterRecord,
  totalUnits: number,
  totalQualityPoints: number
): SemesterRecord {
  const semesterQPI = totalUnits > 0 ? totalQualityPoints / totalUnits : 0;

  return {
    ...semesterRecord,
    totalUnits,
    totalQualityPoints,
    semesterQPI,
    updatedAt: Date.now(),
  };
}