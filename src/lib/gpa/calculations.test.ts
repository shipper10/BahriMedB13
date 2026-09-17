/**
 * calculations.test.ts — validates the mathematical engine
 * (blueprint §3.4): semester GPA, year GPA, weighted progressive CGPA
 * (including the 5% first-year weight), the Sup 2.0 cap, the Inc
 * denominator exclusion, and the partial-semester provisional CGPA.
 */
import { describe, expect, it } from 'vitest';

import { COURSE_NOTES, GRADE_SCALE } from './taxonomy';
import {
  pointValue,
  progressiveCgpa,
  provisionalEstimatedCgpa,
  semesterGpa,
  yearGpa,
  type CourseGradeInput,
  type SemesterInput,
} from './calculations';

function course(
  gradeLetter: keyof typeof GRADE_SCALE,
  credits: number,
  courseNote?: CourseGradeInput['courseNote'],
): CourseGradeInput {
  return { gradeLetter, credits, courseNote };
}

describe('pointValue (blueprint §3.4)', () => {
  it('returns raw letter points for a regular course', () => {
    expect(pointValue('A')).toBe(4.0);
    expect(pointValue('B+')).toBe(3.5);
    expect(pointValue('C')).toBe(2.0);
    expect(pointValue('F')).toBe(0.0);
  });

  it('caps Sup grade points at 2.0 even for an A', () => {
    expect(pointValue('A', COURSE_NOTES.SUP)).toBe(2.0);
    expect(pointValue('C', COURSE_NOTES.SUP)).toBe(2.0);
  });

  it('keeps Sub (substitute) uncapped', () => {
    expect(pointValue('A', COURSE_NOTES.SUB)).toBe(4.0);
  });

  it('returns null for Inc and null grades', () => {
    expect(pointValue('A', COURSE_NOTES.INC)).toBeNull();
    expect(pointValue(null)).toBeNull();
  });
});

describe('semesterGpa (blueprint §3.4 A)', () => {
  it('computes a plain weighted average', () => {
    const gpa = semesterGpa([course('A', 4), course('C', 2), course('B', 4)]);
    // (4*4 + 2*2 + 3*4) / (4+2+4) = (16+4+12)/10 = 32/10 = 3.2
    expect(gpa).toBeCloseTo(3.2, 6);
  });

  it('caps Sup credits at 2.0 in the numerator', () => {
    // A(4cr) + A-Sup(4cr) -> (16 + 2*4) / 8 = 24/8 = 3.0
    const gpa = semesterGpa([
      course('A', 4),
      course('A', 4, COURSE_NOTES.SUP),
    ]);
    expect(gpa).toBeCloseTo(3.0, 6);
  });

  it('excludes Inc credits from the denominator entirely', () => {
    // A(4cr) + Inc(4cr) -> 16 / 4 = 4.0  (Inc contributes neither term)
    const gpa = semesterGpa([
      course('A', 4),
      course('F', 4, COURSE_NOTES.INC),
    ]);
    expect(gpa).toBe(4.0);
  });

  it('returns null when the denominator is empty', () => {
    expect(semesterGpa([course('A', 4, COURSE_NOTES.INC)])).toBeNull();
    expect(semesterGpa([])).toBeNull();
  });
});

describe('yearGpa (blueprint §3.4 B)', () => {
  it('is denominator-weighted across both semesters', () => {
    const s1: SemesterInput = {
      courses: [course('A', 4), course('B', 4), course('A', 2)],
    };
    const s2: SemesterInput = {
      courses: [course('C', 2), course('B+', 4)],
    };
    // S1: (16 + 12 + 8)/10 = 36/10 = 3.6 ; S2: (4 + 14)/6 = 18/6 = 3.0
    // Year: (36 + 18)/(10+6) = 54/16 = 3.375
    expect(yearGpa([s1, s2])).toBeCloseTo(3.375, 6);
  });
});

describe('progressiveCgpa (blueprint §3.4 C)', () => {
  it('yields exactly the year GPA when only Year 1 is complete (w1 = 5%)', () => {
    // CGPA = (0.05 * 3.60) / 0.05 = 3.60
    expect(progressiveCgpa([3.6])).toBeCloseTo(3.6, 6);
  });

  it('weights completed years by their graduation weights', () => {
    // Y1 = 3.60 (w=0.05), Y2 = 3.20 (w=0.10)
    // (0.05*3.6 + 0.10*3.2)/(0.05+0.10) = 0.5 / 0.15 = 3.3333...
    expect(progressiveCgpa([3.6, 3.2])).toBeCloseTo(3.333333, 5);
  });

  it('documents the blueprint worked example to 3 decimals', () => {
    const cgpa = progressiveCgpa([3.6, 3.2])!;
    expect(Number(cgpa.toFixed(3))).toBe(3.333);
  });

  it('ignores incomplete (null) years without suppressing the CGPA', () => {
    // Only Y2 known -> weight 0.10 alone.
    expect(progressiveCgpa([null, 3.0])).toBeCloseTo(3.0, 6);
  });
});

describe('provisionalEstimatedCgpa (blueprint §3.4 D)', () => {
  it('uses 0.5 * w_k as the interim weight for the partial year', () => {
    // Y1 complete (3.6, w=0.05); Y2 partial GPA 3.2 with interim 0.5*0.10=0.05
    // (0.05*3.6 + 0.05*3.2) / 0.10 = 0.34/0.10 = 3.4
    expect(provisionalEstimatedCgpa([3.6], 3.2, 1)).toBeCloseTo(3.4, 6);
  });
});