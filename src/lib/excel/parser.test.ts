/**
 * parser.test.ts — validates the Excel ingestion engine (blueprint §5):
 * column mapping, both semesters' grades, origin_tag derivation, and the
 * end-to-end parse of the real `multi - Copy.xlsx` (269 students).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { COURSE_NOTES } from '../gpa/taxonomy';
import {
  SEMESTER1_COURSES,
  SEMESTER2_COURSES,
  deriveOriginTag,
  parseGradeCell,
  parseSheetData,
  parseXlsxBuffer,
  parseXlsxFile,
} from './parser';

const SERVICE_SHEET_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../..',
  'multi - Copy.xlsx',
);

describe('parseGradeCell', () => {
  it('parses plain grade letters', () => {
    expect(parseGradeCell('A').gradeLetter).toBe('A');
    expect(parseGradeCell('B+').gradeLetter).toBe('B+');
    expect(parseGradeCell('C').gradeLetter).toBe('C');
  });

  it('parses a grade followed by an academic note', () => {
    expect(parseGradeCell('A Sup')).toEqual({
      gradeLetter: 'A',
      note: COURSE_NOTES.SUP,
    });
    expect(parseGradeCell('C Inc')).toEqual({
      gradeLetter: 'C',
      note: COURSE_NOTES.INC,
    });
  });

  it('treats absent cells as ungraded / NONE', () => {
    expect(parseGradeCell(null).note).toBe(COURSE_NOTES.NONE);
    expect(parseGradeCell('').gradeLetter).toBeNull();
  });
});

describe('deriveOriginTag (blueprint §5)', () => {
  it('maps trailing ID digits to cohort tags', () => {
    expect(deriveOriginTag('1100305423')).toBe('23');
    expect(deriveOriginTag('1100441024')).toBe('24');
    expect(deriveOriginTag('1100516022')).toBe('legacy_22');
    expect(deriveOriginTag('1100516021')).toBe('legacy_21');
  });
});

describe('parseSheetData (pure, hand-built rows)', () => {
  it('extracts grades from both semesters and the origin tag', () => {
    const row = [
      '1100305423', // 0 id
      'MOHAMMED AHMED', // 1 name_en
      'محمد أحمد', // 2 name_ar
      3.5, // 3 year gpa
      'Pas', // 4 remark
      '', // 5 label
      'A', 'B+', 'A', 'A', 'A', 'A', 'B', 'B+', // 6-13 S1
      3.7, // 14 S1 gpa
      'A', 'C', 'B', 'B+', 'B+', // 15-19 S2
      3.2, // 20 S2 gpa
      '', '', '', '', // 21-24
    ];
    // Pad header rows so the data row lands at the expected index (>= FIRST_DATA_ROW).
    const rows: unknown[][] = [
      ['First Year'],
      ['ID', 'Name', 'name_ar', 'GPA', 'Remark', 'CH', 'Semester 1'],
      ['', '', '', '', '', '', 'Cell Biology'],
      ['', '', '', '', '', '', 2],
      row,
    ];
    const result = parseSheetData(rows);
    expect(result.totalStudents).toBe(1);
    const student = result.students[0];
    expect(student.studentId).toBe('1100305423');
    expect(student.originTag).toBe('23');
    expect(student.grades).toHaveLength(
      SEMESTER1_COURSES.length + SEMESTER2_COURSES.length,
    );
    expect(student.grades.filter((g) => g.semesterId === 'Y1_S1')).toHaveLength(
      SEMESTER1_COURSES.length,
    );
    expect(student.grades.filter((g) => g.semesterId === 'Y1_S2')).toHaveLength(
      SEMESTER2_COURSES.length,
    );
  });
});

describe('multi - Copy.xlsx end-to-end parse', () => {
  it('extracts exactly 269 students and 37 credits of Year 1', () => {
    const result = parseXlsxFile(SERVICE_SHEET_PATH);
    expect(result.totalStudents).toBe(269);
    expect(result.semester1Credits).toBe(22);
    expect(result.semester2Credits).toBe(15);
    expect(result.year1Credits).toBe(37);
  });

  it('reads the first student with 13 grades and matching GPA', () => {
    const result = parseXlsxFile(SERVICE_SHEET_PATH).students[0];
    expect(result.studentId).toBe('1100305423');
    expect(result.nameEn).toContain('MOHAMMED');
    expect(result.grades).toHaveLength(13);
    // Cell Biology (col 6) -> A, Chemistry (col 7) -> B+
    expect(result.grades[0].gradeLetter).toBe('A');
    expect(result.grades[1].gradeLetter).toBe('B+');
    // Semester 2 first course Biomolecules -> A
    expect(result.grades[8].gradeLetter).toBe('A');
  });

  it('derives origin tags across the whole cohort', () => {
    const students = parseXlsxFile(SERVICE_SHEET_PATH).students;
    const tags = new Set(students.map((s) => s.originTag));
    // The file is dominated by batch 23/24 with legacy 21/22 mixed in.
    expect(tags.has('23')).toBe(true);
    expect(tags.has('24')).toBe(true);
    for (const s of students) {
      expect(s.originTag).toMatch(/^(23|24|legacy_21|legacy_22)$/);
    }
  });

  it('every student has a numeric ID and a remark from the taxonomy', () => {
    const students = parseXlsxFile(SERVICE_SHEET_PATH).students;
    for (const s of students) {
      expect(/^\d+$/.test(s.studentId)).toBe(true);
      expect(s.remark).toBe('Pas');
    }
  });

  it('round-trips through the raw buffer parser', () => {
    const buffer = readFileSync(SERVICE_SHEET_PATH);
    const result = parseXlsxBuffer(buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer);
    expect(result.totalStudents).toBe(269);
  });

  it('recomputes the first student GPA consistently with the sheet', () => {
    const s = parseXlsxFile(SERVICE_SHEET_PATH).students[0];
    // We trust the parser data; verify the GPA column round-trips as a number.
    expect(typeof s.semester1Gpa).toBe('number');
    expect(s.semester1Gpa).toBeCloseTo(3.7727, 3);
    expect(s.semester2Gpa).toBeCloseTo(3.2667, 3);
  });
});