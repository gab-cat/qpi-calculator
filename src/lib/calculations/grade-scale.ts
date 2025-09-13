// Grade scale conversion utilities for Philippine academic system

import type { GradeScale } from '../types/academic-types';

export const GRADE_SCALE: GradeScale = {
  'A':  { min: 98, max: 100, points: 4.0 },
  'B+': { min: 94, max: 97,  points: 3.5 },
  'B':  { min: 90, max: 93,  points: 3.0 },
  'C+': { min: 86, max: 89,  points: 2.5 },
  'C':  { min: 82, max: 85,  points: 2.0 },
  'D+': { min: 78, max: 81,  points: 1.5 },
  'D':  { min: 75, max: 77,  points: 1.0 },
  'F':  { min: 0,  max: 74,  points: 0.0 },
} as const;

/**
 * Convert numerical grade to letter grade
 */
export function convertNumericalToLetter(numericalGrade: number): string {
  if (!isValidNumericalGrade(numericalGrade)) {
    throw new Error(`Invalid numerical grade: ${numericalGrade}. Must be between 0 and 100.`);
  }

  for (const [letter, scale] of Object.entries(GRADE_SCALE)) {
    if (numericalGrade >= scale.min && numericalGrade <= scale.max) {
      return letter;
    }
  }

  // Fallback (should not happen with valid input)
  throw new Error(`Unable to convert numerical grade: ${numericalGrade}`);
}

/**
 * Convert numerical grade to grade point (0.0-4.0)
 */
export function convertNumericalToGradePoint(numericalGrade: number): number {
  if (!isValidNumericalGrade(numericalGrade)) {
    throw new Error(`Invalid numerical grade: ${numericalGrade}. Must be between 0 and 100.`);
  }

  for (const scale of Object.values(GRADE_SCALE)) {
    if (numericalGrade >= scale.min && numericalGrade <= scale.max) {
      return scale.points;
    }
  }

  // Fallback (should not happen with valid input)
  return 0.0;
}

/**
 * Convert letter grade to grade point (0.0-4.0)
 */
export function convertLetterToGradePoint(letterGrade: string): number {
  const normalizedLetter = letterGrade.toUpperCase();
  
  if (!GRADE_SCALE[normalizedLetter]) {
    throw new Error(`Invalid letter grade: ${letterGrade}. Valid grades are: ${Object.keys(GRADE_SCALE).join(', ')}`);
  }

  return GRADE_SCALE[normalizedLetter].points;
}

/**
 * Validate numerical grade is within acceptable range
 */
export function isValidNumericalGrade(grade: number): boolean {
  return Number.isFinite(grade) && grade >= 0 && grade <= 100;
}

/**
 * Get grade scale information for a specific letter grade
 */
export function getGradeScaleInfo(letterGrade: string) {
  const normalizedLetter = letterGrade.toUpperCase();
  
  if (!GRADE_SCALE[normalizedLetter]) {
    throw new Error(`Invalid letter grade: ${letterGrade}`);
  }

  return GRADE_SCALE[normalizedLetter];
}

/**
 * Get all available letter grades
 */
export function getAvailableLetterGrades(): string[] {
  return Object.keys(GRADE_SCALE);
}

/**
 * Check if a numerical grade is passing (>= 75)
 */
export function isPassing(numericalGrade: number): boolean {
  return isValidNumericalGrade(numericalGrade) && numericalGrade >= 75;
}

/**
 * Check if a letter grade is passing (!= F)
 */
export function isPassingLetterGrade(letterGrade: string): boolean {
  const normalizedLetter = letterGrade.toUpperCase();
  return normalizedLetter !== 'F' && Object.keys(GRADE_SCALE).includes(normalizedLetter);
}