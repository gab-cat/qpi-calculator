import { describe, it, expect } from 'vitest';
import { convertNumericalToLetter, convertNumericalToGradePoint, convertLetterToGradePoint, isValidNumericalGrade, GRADE_SCALE } from '../../src/lib/calculations/grade-scale';


describe('Grade Scale Conversion', () => {
  describe('convertNumericalToLetter', () => {
    it('should convert A range grades correctly', () => {
      expect(convertNumericalToLetter(100)).toBe('A');
      expect(convertNumericalToLetter(98)).toBe('A');
    });

    it('should convert B+ range grades correctly', () => {
      expect(convertNumericalToLetter(97)).toBe('B+');
      expect(convertNumericalToLetter(94)).toBe('B+');
    });

    it('should convert B range grades correctly', () => {
      expect(convertNumericalToLetter(93)).toBe('B');
      expect(convertNumericalToLetter(90)).toBe('B');
    });

    it('should convert C+ range grades correctly', () => {
      expect(convertNumericalToLetter(89)).toBe('C+');
      expect(convertNumericalToLetter(86)).toBe('C+');
    });

    it('should convert C range grades correctly', () => {
      expect(convertNumericalToLetter(85)).toBe('C');
      expect(convertNumericalToLetter(82)).toBe('C');
    });

    it('should convert D+ range grades correctly', () => {
      expect(convertNumericalToLetter(81)).toBe('D+');
      expect(convertNumericalToLetter(78)).toBe('D+');
    });

    it('should convert D range grades correctly', () => {
      expect(convertNumericalToLetter(77)).toBe('D');
      expect(convertNumericalToLetter(75)).toBe('D');
    });

    it('should convert F range grades correctly', () => {
      expect(convertNumericalToLetter(74)).toBe('F');
      expect(convertNumericalToLetter(50)).toBe('F');
      expect(convertNumericalToLetter(0)).toBe('F');
    });

    it('should throw error for invalid grades', () => {
      expect(() => convertNumericalToLetter(-1)).toThrow();
      expect(() => convertNumericalToLetter(101)).toThrow();
    });
  });

  describe('convertNumericalToGradePoint', () => {
    it('should convert A range to 4.0 points', () => {
      expect(convertNumericalToGradePoint(100)).toBe(4.0);
      expect(convertNumericalToGradePoint(98)).toBe(4.0);
    });

    it('should convert B+ range to 3.5 points', () => {
      expect(convertNumericalToGradePoint(97)).toBe(3.5);
      expect(convertNumericalToGradePoint(94)).toBe(3.5);
    });

    it('should convert B range to 3.0 points', () => {
      expect(convertNumericalToGradePoint(93)).toBe(3.0);
      expect(convertNumericalToGradePoint(90)).toBe(3.0);
    });

    it('should convert C+ range to 2.5 points', () => {
      expect(convertNumericalToGradePoint(89)).toBe(2.5);
      expect(convertNumericalToGradePoint(86)).toBe(2.5);
    });

    it('should convert C range to 2.0 points', () => {
      expect(convertNumericalToGradePoint(85)).toBe(2.0);
      expect(convertNumericalToGradePoint(82)).toBe(2.0);
    });

    it('should convert D+ range to 1.5 points', () => {
      expect(convertNumericalToGradePoint(81)).toBe(1.5);
      expect(convertNumericalToGradePoint(78)).toBe(1.5);
    });

    it('should convert D range to 1.0 point', () => {
      expect(convertNumericalToGradePoint(77)).toBe(1.0);
      expect(convertNumericalToGradePoint(75)).toBe(1.0);
    });

    it('should convert F range to 0.0 points', () => {
      expect(convertNumericalToGradePoint(74)).toBe(0.0);
      expect(convertNumericalToGradePoint(0)).toBe(0.0);
    });
  });

  describe('convertLetterToGradePoint', () => {
    it('should convert letter grades to correct points', () => {
      expect(convertLetterToGradePoint('A')).toBe(4.0);
      expect(convertLetterToGradePoint('B+')).toBe(3.5);
      expect(convertLetterToGradePoint('B')).toBe(3.0);
      expect(convertLetterToGradePoint('C+')).toBe(2.5);
      expect(convertLetterToGradePoint('C')).toBe(2.0);
      expect(convertLetterToGradePoint('D+')).toBe(1.5);
      expect(convertLetterToGradePoint('D')).toBe(1.0);
      expect(convertLetterToGradePoint('F')).toBe(0.0);
    });

    it('should handle case variations', () => {
      expect(convertLetterToGradePoint('a')).toBe(4.0);
      expect(convertLetterToGradePoint('b+')).toBe(3.5);
      expect(convertLetterToGradePoint('B+')).toBe(3.5);
    });

    it('should throw error for invalid letter grades', () => {
      expect(() => convertLetterToGradePoint('Z')).toThrow();
      expect(() => convertLetterToGradePoint('A+')).toThrow();
      expect(() => convertLetterToGradePoint('')).toThrow();
    });
  });

  describe('isValidNumericalGrade', () => {
    it('should validate correct grade ranges', () => {
      expect(isValidNumericalGrade(0)).toBe(true);
      expect(isValidNumericalGrade(50)).toBe(true);
      expect(isValidNumericalGrade(75)).toBe(true);
      expect(isValidNumericalGrade(100)).toBe(true);
    });

    it('should reject invalid grades', () => {
      expect(isValidNumericalGrade(-1)).toBe(false);
      expect(isValidNumericalGrade(101)).toBe(false);
      expect(isValidNumericalGrade(NaN)).toBe(false);
      expect(isValidNumericalGrade(Infinity)).toBe(false);
    });
  });

  describe('GRADE_SCALE constant', () => {
    it('should have all required grade levels', () => {
      expect(GRADE_SCALE).toHaveProperty('A');
      expect(GRADE_SCALE).toHaveProperty('B+');
      expect(GRADE_SCALE).toHaveProperty('B');
      expect(GRADE_SCALE).toHaveProperty('C+');
      expect(GRADE_SCALE).toHaveProperty('C');
      expect(GRADE_SCALE).toHaveProperty('D+');
      expect(GRADE_SCALE).toHaveProperty('D');
      expect(GRADE_SCALE).toHaveProperty('F');
    });

    it('should have correct point values', () => {
      expect(GRADE_SCALE.A.points).toBe(4.0);
      expect(GRADE_SCALE['B+'].points).toBe(3.5);
      expect(GRADE_SCALE.B.points).toBe(3.0);
      expect(GRADE_SCALE['C+'].points).toBe(2.5);
      expect(GRADE_SCALE.C.points).toBe(2.0);
      expect(GRADE_SCALE['D+'].points).toBe(1.5);
      expect(GRADE_SCALE.D.points).toBe(1.0);
      expect(GRADE_SCALE.F.points).toBe(0.0);
    });

    it('should have correct grade ranges', () => {
      expect(GRADE_SCALE.A.min).toBe(98);
      expect(GRADE_SCALE.A.max).toBe(100);
      expect(GRADE_SCALE.F.min).toBe(0);
      expect(GRADE_SCALE.F.max).toBe(74);
    });

    it('should have continuous ranges with no gaps', () => {
      const grades = Object.values(GRADE_SCALE);
      grades.sort((a, b) => b.min - a.min); // Sort by min descending
      
      // Check that ranges are continuous
      for (let i = 0; i < grades.length - 1; i++) {
        expect(grades[i].min).toBe(grades[i + 1].max + 1);
      }
    });
  });
});