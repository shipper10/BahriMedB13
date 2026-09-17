/**
 * excel/parser.ts — SheetJS parser with Zod validation (blueprint §5 / §2).
 *
 * Column map for `multi - Copy.xlsx` (0-indexed, first sheet):
 *   Col 0 : Student ID
 *   Col 1 : Name (EN)
 *   Col 2 : Name (AR)
 *   Col 3 : Full Year 1 GPA
 *   Col 4 : Official Remark (academic_remark)
 *   Cols 6–13 : Semester 1 course grades (Cell Biology … University Study Skills)
 *   Col 14: Semester 1 computed GPA
 *   Cols 15–19 : Semester 2 course grades (Biomolecules … Medical Terminology)
 *   Col 20: Semester 2 computed GPA
 *
 *   Origin Tag = ID.slice(-2) → '23' | '24' | 'legacy_22' | 'legacy_21'
 *
 * Headers: Row 2 labels, Row 3 course names, Row 4 credit hours,
 * Student rows 5 – 273 (269 active students).
 */
import * as XLSX from 'xlsx';
import { z } from 'zod';

import {
  ACADEMIC_REMARKS,
  COURSE_NOTES,
  type AcademicRemark,
  type CourseNote,
  type GradeLetter,
} from '../gpa/taxonomy';

/* ------------------------------------------------------------------ *
 * Constants / column map
 * ------------------------------------------------------------------ */

export const GRADES: readonly GradeLetter[] = ['A', 'B+', 'B', 'C', 'F'];
export const VALID_GRADE_SET: ReadonlySet<string> = new Set(GRADES);

/** Valid course-level note tokens that can appear after a grade letter. */
export const NOTE_TOKENS: ReadonlySet<string> = new Set([
  COURSE_NOTES.SUP,
  COURSE_NOTES.SUB,
  COURSE_NOTES.CRO,
  COURSE_NOTES.INC,
  COURSE_NOTES.RTK,
  COURSE_NOTES.RST,
]);

export interface CourseDef {
  col: number;
  code: string;
  nameEn: string;
  nameAr: string;
  creditHours: number;
}

/** Semester 1 courses (cols 6–13). */
export const SEMESTER1_COURSES: readonly CourseDef[] = [
  { col: 6, code: 'CB', nameEn: 'Cell Biology', nameAr: 'بيولوجيا الخلية', creditHours: 2 },
  { col: 7, code: 'CHM', nameEn: 'Chemistry', nameAr: 'الكيمياء', creditHours: 4 },
  { col: 8, code: 'ENG1', nameEn: 'English Language Skills I', nameAr: 'مهارات اللغة الانجليزية I', creditHours: 4 },
  { col: 9, code: 'ENG2', nameEn: 'English Language Skills II', nameAr: 'مهارات اللغة الانجليزية II', creditHours: 4 },
  { col: 10, code: 'SOC', nameEn: 'Introduction to Sociology & Psychology', nameAr: 'مدخل إلى علم الاجتماع وعلم النفس', creditHours: 2 },
  { col: 11, code: 'MATH', nameEn: 'Mathematics', nameAr: 'الرياضيات', creditHours: 2 },
  { col: 12, code: 'PHYS', nameEn: 'Medical Physics', nameAr: 'الفيزياء الطبية', creditHours: 2 },
  { col: 13, code: 'USK', nameEn: 'University Study Skills', nameAr: 'مهارات الدراسة الجامعية', creditHours: 2 },
];

/** Semester 2 courses (cols 15–19). */
export const SEMESTER2_COURSES: readonly CourseDef[] = [
  { col: 15, code: 'BIO', nameEn: 'Biomolecules', nameAr: 'الجزيئات الحيوية', creditHours: 3 },
  { col: 16, code: 'CH', nameEn: 'Community Health', nameAr: 'صحة المجتمع', creditHours: 2 },
  { col: 17, code: 'HOME', nameEn: 'Homeostasis', nameAr: 'الاتزان الداخلي', creditHours: 4 },
  { col: 18, code: 'HB', nameEn: 'Human Biology', nameAr: 'بيولوجيا الإنسان', creditHours: 4 },
  { col: 19, code: 'MTERM', nameEn: 'Medical Terminology', nameAr: 'المصطلحات الطبية', creditHours: 2 },
];

export const SEMESTER_COURSES: Readonly<Record<string, readonly CourseDef[]>> = {
  Y1_S1: SEMESTER1_COURSES,
  Y1_S2: SEMESTER2_COURSES,
};

/** 0-indexed row of the first student data row (row 5 1-indexed). */
export const FIRST_DATA_ROW = 4;
/* ------------------------------------------------------------------ *
 * Grade-cell parsing
 * ------------------------------------------------------------------ */

/**
 * Parse a raw grade cell. Handles "A", "B+", "C Sup", "F", empty, etc.
 * Returns the grade letter (or null) plus the detected course note.
 */
export function parseGradeCell(
  raw: unknown,
): { gradeLetter: GradeLetter | null; note: CourseNote } {
  if (raw === null || raw === undefined || raw === '') {
    return { gradeLetter: null, note: COURSE_NOTES.NONE };
  }
  const text = String(raw).trim();
  if (text === '' || text === '-') {
    return { gradeLetter: null, note: COURSE_NOTES.NONE };
  }
  const parts = text.split(/\s+/);
  const first = parts.shift()!.toUpperCase();
  if (VALID_GRADE_SET.has(first)) {
    const gradeLetter = first as GradeLetter;
    const remainder = parts.join(' ').trim();
    const note = NOTE_TOKENS.has(remainder) ? (remainder as CourseNote) : COURSE_NOTES.NONE;
    return { gradeLetter, note };
  }
  // First token isn't a grade letter at all.
  return { gradeLetter: null, note: COURSE_NOTES.NONE };
}

/**
 * Derive the origin tag from the trailing two digits of the student ID
 * (blueprint §5): 23 → '23', 24 → '24', 22 → 'legacy_22', 21 → 'legacy_21'.
 */
export function deriveOriginTag(studentId: string): string {
  const tail = studentId.slice(-2);
  if (tail === '23') return '23';
  if (tail === '24') return '24';
  if (tail === '22') return 'legacy_22';
  if (tail === '21') return 'legacy_21';
  return tail;
}
/* ------------------------------------------------------------------ *
 * Zod schemas (runtime validation)
 * ------------------------------------------------------------------ */

export const gradeLetterSchema = z.enum(['A', 'B+', 'B', 'C', 'F']);
export const courseNoteSchema = z.enum([
  COURSE_NOTES.NONE,
  COURSE_NOTES.SUP,
  COURSE_NOTES.SUB,
  COURSE_NOTES.CRO,
  COURSE_NOTES.INC,
  COURSE_NOTES.RTK,
  COURSE_NOTES.RST,
]);
export const academicRemarkSchema = z.enum([
  ACADEMIC_REMARKS.PAS,
  ACADEMIC_REMARKS.PRM,
  ACADEMIC_REMARKS.RPT,
  ACADEMIC_REMARKS.RDO,
  ACADEMIC_REMARKS.FRZ,
  ACADEMIC_REMARKS.SUS,
  ACADEMIC_REMARKS.WDR,
  ACADEMIC_REMARKS.CRG,
  ACADEMIC_REMARKS.DSC,
  ACADEMIC_REMARKS.DSM,
  ACADEMIC_REMARKS.RAD,
  ACADEMIC_REMARKS.RRG,
  ACADEMIC_REMARKS.REJ,
  ACADEMIC_REMARKS.PND,
]);

const parsedCourseGradeSchema = z.object({
  courseCode: z.string().min(1),
  semesterId: z.string().min(1),
  nameEn: z.string(),
  nameAr: z.string(),
  creditHours: z.number().positive(),
  gradeLetter: gradeLetterSchema.nullable(),
  numericScore: z.number().nullable(),
  courseNote: courseNoteSchema,
});

export const parsedStudentSchema = z.object({
  studentId: z.string().min(1),
  nameEn: z.string(),
  nameAr: z.string(),
  originTag: z.string().min(1),
  remark: academicRemarkSchema,
  yearGpa: z.number().min(0).optional(),
  semester1Gpa: z.number().min(0).optional(),
  semester2Gpa: z.number().min(0).optional(),
  grades: z.array(parsedCourseGradeSchema),
});

export const parseResultSchema = z.object({
  students: z.array(parsedStudentSchema),
  totalStudents: z.number().int().nonnegative(),
  semester1Credits: z.number().positive(),
  semester2Credits: z.number().positive(),
  year1Credits: z.number().positive(),
});

export type ParsedCourseGrade = z.infer<typeof parsedCourseGradeSchema>;
export type ParsedStudent = z.infer<typeof parsedStudentSchema>;
export type ParseResult = z.infer<typeof parseResultSchema>;
/* ------------------------------------------------------------------ *
 * Core parsing
 * ------------------------------------------------------------------ */

/**
 * Parse a raw 2D array of worksheet values (from `sheet_to_json(header:1)`)
 * into a validated {@link ParseResult}. Pure function → unit-testable.
 */
export function parseSheetData(
  rows: readonly (unknown[] | null | undefined)[],
): ParseResult {
  const students: ParsedStudent[] = [];

  for (let r = FIRST_DATA_ROW; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const rawId = row[0];
    const nameEn = row[1];
    const nameAr = row[2];
    const yearGpaRaw = row[3];
    const remarkRaw = row[4];
    const s1GpaRaw = row[14];
    const s2GpaRaw = row[20];

    // Skip fully empty trailing rows.
    if ((rawId === null || rawId === undefined || rawId === '') && !nameEn) {
      continue;
    }

    const studentId = String(rawId).trim();
    if (!studentId) continue;
    if (!/^\d+$/.test(studentId)) continue; // guard: only numeric IDs

    const grades: ParsedCourseGrade[] = [];

    for (const [semesterId, defs] of Object.entries(SEMESTER_COURSES)) {
      for (const def of defs) {
        const { gradeLetter, note } = parseGradeCell(row[def.col]);
        grades.push({
          courseCode: def.code,
          semesterId,
          nameEn: def.nameEn,
          nameAr: def.nameAr,
          creditHours: def.creditHours,
          gradeLetter,
          numericScore: null, // file stores letters only
          courseNote: note,
        });
      }
    }

    const remarkParsed = academicRemarkSchema.safeParse(
      String(remarkRaw ?? '').trim(),
    );
    const remark = remarkParsed.success
      ? (remarkParsed.data as AcademicRemark)
      : ACADEMIC_REMARKS.PAS;

    students.push({
      studentId,
      nameEn: String(nameEn ?? '').trim(),
      nameAr: String(nameAr ?? '').trim(),
      originTag: deriveOriginTag(studentId),
      remark,
      yearGpa: toNumber(yearGpaRaw),
      semester1Gpa: toNumber(s1GpaRaw),
      semester2Gpa: toNumber(s2GpaRaw),
      grades,
    });
  }

  const semester1Credits = SEMESTER1_COURSES.reduce(
    (sum, c) => sum + c.creditHours,
    0,
  );
  const semester2Credits = SEMESTER2_COURSES.reduce(
    (sum, c) => sum + c.creditHours,
    0,
  );

  const result: ParseResult = {
    students,
    totalStudents: students.length,
    semester1Credits,
    semester2Credits,
    year1Credits: semester1Credits + semester2Credits,
  };
  return parseResultSchema.parse(result);
}

/** Safely coerce a cell to a finite number, or undefined. */
function toNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const n = Number(raw.trim());
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Read a `.xlsx` buffer/array-buffer and parse it. Returns a validated
 * {@link ParseResult}. Throws if the sheet cannot be read or fails Zod.
 */
export function parseXlsxBuffer(buffer: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel workbook contains no sheets.');
  }
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    defval: '',
  });
  return parseSheetData(rows ?? []);
}

/**
 * Convenience helper for Node/CLI contexts: read a file path directly.
 */
export function parseXlsxFile(filePath: string): ParseResult {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel workbook contains no sheets.');
  }
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    defval: '',
  });
  return parseSheetData(rows ?? []);
}