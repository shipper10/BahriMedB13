/**
 * taxonomy.test.ts — validates the full academic symbols taxonomy
 * (blueprint §3.2 / §3.3): the grade-point scale, the 7 course-level
 * codes and the 14 student/year-level remarks, plus their business rules
 * (Sup cap = 2.0, Inc excluded from denominator, PND excluded from ranking).
 */
import { describe, expect, it } from 'vitest';

import {
  ACADEMIC_REMARK_CODES,
  ACADEMIC_REMARKS,
  ACADEMIC_REMARK_SYMBOLS,
  COURSE_NOTE_CODES,
  COURSE_NOTES,
  COURSE_NOTE_SYMBOLS,
  GRADE_SCALE,
  academicRemarkInfo,
  courseNoteInfo,
} from './taxonomy';

describe('GRADE_SCALE (blueprint §3.2)', () => {
  it('defines the five letter grades with correct points', () => {
    expect(GRADE_SCALE.A.points).toBe(4.0);
    expect(GRADE_SCALE['B+'].points).toBe(3.5);
    expect(GRADE_SCALE.B.points).toBe(3.0);
    expect(GRADE_SCALE.C.points).toBe(2.0);
    expect(GRADE_SCALE.F.points).toBe(0.0);
  });

  it('keeps monotonic non-increasing points from A down to F', () => {
    const ordered = Object.values(GRADE_SCALE);
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].points).toBeLessThanOrEqual(ordered[i - 1].points);
    }
  });
});

describe('Course-Level Codes (blueprint §3.3 A)', () => {
  it('exposes exactly the 7 course codes', () => {
    expect(COURSE_NOTE_CODES).toHaveLength(7);
    expect([...COURSE_NOTE_CODES].sort()).toEqual(
      ['NONE', 'Sup', 'Sub', 'Cro', 'Inc', 'Rtk', 'Rst'].sort(),
    );
  });

  it('maps every course note to rich metadata', () => {
    expect(COURSE_NOTE_SYMBOLS).toHaveLength(7);
    for (const code of COURSE_NOTE_CODES) {
      const meta = courseNoteInfo(code);
      expect(meta.code).toBe(code);
      expect(meta.ar.length).toBeGreaterThan(0);
      expect(meta.en.length).toBeGreaterThan(0);
    }
  });

  it('locks Sup grade points at 2.0 (Grade C) regardless of score', () => {
    expect(courseNoteInfo(COURSE_NOTES.SUP).cappedPoints).toBe(2.0);
    // Sup never reduces the denominator.
    expect(courseNoteInfo(COURSE_NOTES.SUP).excludeFromDenominator).toBe(false);
  });

  it('keeps Sub (substitute) uncapped', () => {
    expect(courseNoteInfo(COURSE_NOTES.SUB).cappedPoints).toBeNull();
  });

  it('excludes Inc credits from the GPA denominator', () => {
    expect(courseNoteInfo(COURSE_NOTES.INC).excludeFromDenominator).toBe(true);
  });

  it('keeps NONE / Cro / Rtk / Rst as regular (non-excluded) courses', () => {
    for (const code of [COURSE_NOTES.NONE, COURSE_NOTES.CRO, COURSE_NOTES.RTK, COURSE_NOTES.RST]) {
      expect(courseNoteInfo(code).excludeFromDenominator).toBe(false);
      expect(courseNoteInfo(code).cappedPoints).toBeNull();
    }
  });
});

describe('Student/Year-Level Remarks (blueprint §3.3 B)', () => {
  it('exposes exactly the 14 remark codes', () => {
    expect(ACADEMIC_REMARK_CODES).toHaveLength(14);
    expect([...ACADEMIC_REMARK_CODES].sort()).toEqual(
      ['Pas', 'Prm', 'Rpt', 'Rdo', 'Frz', 'Sus', 'Wdr', 'Crg', 'Dsc', 'Dsm', 'Rad', 'Rrg', 'Rej', 'PND'].sort(),
    );
  });

  it('maps every remark to rich metadata', () => {
    expect(ACADEMIC_REMARK_SYMBOLS).toHaveLength(14);
    for (const code of ACADEMIC_REMARK_CODES) {
      const meta = academicRemarkInfo(code);
      expect(meta.code).toBe(code);
      expect(meta.ar.length).toBeGreaterThan(0);
      expect(meta.en.length).toBeGreaterThan(0);
    }
  });

  it('marks Pas and Prm as visible / ranked', () => {
    expect(academicRemarkInfo(ACADEMIC_REMARKS.PAS).excludedFromRanking).toBe(false);
    expect(academicRemarkInfo(ACADEMIC_REMARKS.PRM).excludedFromRanking).toBe(false);
  });

  it('marks PND (pending/withheld) as excluded from ranking (blueprint §3.4 E)', () => {
    expect(academicRemarkInfo(ACADEMIC_REMARKS.PND).excludedFromRanking).toBe(true);
  });

  it('marks freeze / withdraw / suspension / dismissal as excluded from ranking', () => {
    for (const code of [
      ACADEMIC_REMARKS.FRZ,
      ACADEMIC_REMARKS.SUS,
      ACADEMIC_REMARKS.WDR,
      ACADEMIC_REMARKS.DSC,
      ACADEMIC_REMARKS.DSM,
      ACADEMIC_REMARKS.REJ,
      ACADEMIC_REMARKS.CRG,
    ]) {
      expect(academicRemarkInfo(code).excludedFromRanking).toBe(true);
    }
  });
});

describe('Total academic symbols count', () => {
  it('curates a complete decoupled taxonomy (7 course + 14 remarks)', () => {
    expect(COURSE_NOTE_SYMBOLS.length + ACADEMIC_REMARK_SYMBOLS.length).toBe(21);
  });
});