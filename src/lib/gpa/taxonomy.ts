/**
 * gpa/taxonomy.ts — The academic symbols & rules taxonomy (blueprint 3.2 / 3.3).
 *
 * Two strictly decoupled families:
 *  - Course-Level Codes  (`course_grade_note`): NONE, Sup, Sub, Cro, Inc, Rtk, Rst
 *  - Student/Year-Level  (`academic_remark`):   Pas, Prm, Rpt, Rdo, Frz, Sus,
 *    Wdr, Crg, Dsc, Dsm, Rad, Rrg, Rej, PND
 *
 * Pure constants. No I/O. Re-exported alongside the standard grade-point scale.
 */

/** ##### A. Standard Grade Points Scale (blueprint 3.2) ##### */
export const GRADE_SCALE = {
  A: { letter: 'A', minScore: 80, maxScore: 100, points: 4.0 },
  'B+': { letter: 'B+', minScore: 70, maxScore: 79, points: 3.5 },
  B: { letter: 'B', minScore: 60, maxScore: 69, points: 3.0 },
  C: { letter: 'C', minScore: 50, maxScore: 59, points: 2.0 },
  F: { letter: 'F', minScore: 0, maxScore: 49, points: 0.0 },
} as const;

export type GradeLetter = keyof typeof GRADE_SCALE;
export type GradeScaleEntry = (typeof GRADE_SCALE)[GradeLetter];

/** ##### B. Course-Level Codes (`course_grade_note` enum value) ##### */
export const COURSE_NOTES = {
  NONE: 'NONE',
  SUP: 'Sup',
  SUB: 'Sub',
  CRO: 'Cro',
  INC: 'Inc',
  RTK: 'Rtk',
  RST: 'Rst',
} as const;

export type CourseNote = (typeof COURSE_NOTES)[keyof typeof COURSE_NOTES];

/** Sequence used by the Online parser/test to validate the full set. */
export const COURSE_NOTE_CODES: readonly CourseNote[] = [
  COURSE_NOTES.NONE,
  COURSE_NOTES.SUP,
  COURSE_NOTES.SUB,
  COURSE_NOTES.CRO,
  COURSE_NOTES.INC,
  COURSE_NOTES.RTK,
  COURSE_NOTES.RST,
];

/** ##### C. Student/Year-Level Academic Remarks (`academic_remark` enum) ##### */
export const ACADEMIC_REMARKS = {
  PAS: 'Pas',
  PRM: 'Prm',
  RPT: 'Rpt',
  RDO: 'Rdo',
  FRZ: 'Frz',
  SUS: 'Sus',
  WDR: 'Wdr',
  CRG: 'Crg',
  DSC: 'Dsc',
  DSM: 'Dsm',
  RAD: 'Rad',
  RRG: 'Rrg',
  REJ: 'Rej',
  PND: 'PND',
} as const;

export type AcademicRemark =
  (typeof ACADEMIC_REMARKS)[keyof typeof ACADEMIC_REMARKS];

export const ACADEMIC_REMARK_CODES: readonly AcademicRemark[] = [
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
];
/** ##### D. Business-rule definitions (semantic map for badges & engine) ##### */
export interface AcademicSymbolInfo<T extends string> {
  code: T;
  /** Arabic counterpart used on UI badges. */
  ar: string;
  /** English counterpart used on UI badges. */
  en: string;
  /** Free-format rule description for tooltips. */
  description: string;
  /** Whether course credit hours are excluded from GPA denominator. */
  excludeFromDenominator: boolean;
  /** Whether grade points are capped (e.g. Sup -> 2.0). */
  cappedPoints: number | null;
  /** Whether the record is excluded from active cohort rankings. */
  excludedFromRanking: boolean;
}

const COURSE_NOTE_META: Record<
  CourseNote,
  Omit<AcademicSymbolInfo<CourseNote>, 'code'>
> = {
  [COURSE_NOTES.NONE]: {
    ar: 'عادي',
    en: 'Regular Completion',
    description: 'Standard course grading without conditions.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: false,
  },
  [COURSE_NOTES.SUP]: {
    ar: 'ملحق',
    en: 'Supplementary Exam',
    description: 'Repeat exam sat; grade points capped at 2.0 (Grade C) regardless of score.',
    excludeFromDenominator: false,
    cappedPoints: 2.0,
    excludedFromRanking: false,
  },
  [COURSE_NOTES.SUB]: {
    ar: 'بديل',
    en: 'Substitute Exam',
    description: 'Substitute exam with verified excuse; grade points uncapped (full A–F range).',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: false,
  },
  [COURSE_NOTES.CRO]: {
    ar: 'مادة محمولة',
    en: 'Carried Over Course',
    description: 'Failed course carried into a subsequent semester; tracked across terms.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: false,
  },
  [COURSE_NOTES.INC]: {
    ar: 'غير مكتمل',
    en: 'Incomplete Assessment',
    description: 'Assessment incomplete; credit hours excluded from GPA denominator until resolved.',
    excludeFromDenominator: true,
    cappedPoints: null,
    excludedFromRanking: false,
  },
  [COURSE_NOTES.RTK]: {
    ar: 'إعادة حضور',
    en: 'Retake Entire Course',
    description: 'Mandatory re-attendance of lectures and labs in the following term.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: false,
  },
  [COURSE_NOTES.RST]: {
    ar: 'إعادة جلوس',
    en: 'Resit Exam Only',
    description: 'Sitting for the final examination only without re-attendance.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: false,
  },
};
const REMARK_META: Record<
  AcademicRemark,
  Omit<AcademicSymbolInfo<AcademicRemark>, 'code'>
> = {
  [ACADEMIC_REMARKS.PAS]: {
    ar: 'نجاح',
    en: 'Pass',
    description: 'Standard promotion; visible on active leaderboards.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: false,
  },
  [ACADEMIC_REMARKS.PRM]: {
    ar: 'منقول',
    en: 'Promoted with Conditions',
    description: 'Promoted to next year level while carrying allowed credits.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: false,
  },
  [ACADEMIC_REMARKS.RPT]: {
    ar: 'إعادة سنة',
    en: 'Repeat Academic Year',
    description: 'Student re-registers the current academic year; previous records archived.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: true,
  },
  [ACADEMIC_REMARKS.RDO]: {
    ar: 'إعادة دراسة',
    en: 'Re-study Year',
    description: 'Programmatic re-study status; archived under previous academic year tag.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: true,
  },
  [ACADEMIC_REMARKS.FRZ]: {
    ar: 'تجميد',
    en: 'Academic Freeze',
    description: 'Status paused; excluded from active cohort rankings without negative penalty.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: true,
  },
  [ACADEMIC_REMARKS.SUS]: {
    ar: 'تعليق دراسة',
    en: 'Academic Suspension',
    description: 'Administrative suspension; profile access retained in read-only state.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: true,
  },
  [ACADEMIC_REMARKS.WDR]: {
    ar: 'انسحاب',
    en: 'Withdrawal',
    description: 'Officially withdrawn from the faculty; excluded from active leaderboards.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: true,
  },
  [ACADEMIC_REMARKS.CRG]: {
    ar: 'إيقاف تسجيل',
    en: 'Registration Block',
    description: 'Registration hold; flagged in admin dashboard.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: true,
  },
  [ACADEMIC_REMARKS.DSC]: {
    ar: 'فصل مؤقت',
    en: 'Temporary Dismissal',
    description: 'Excluded from active student views for the designated term.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: true,
  },
  [ACADEMIC_REMARKS.DSM]: {
    ar: 'فصل نهائي',
    en: 'Permanent Dismissal',
    description: 'Account deactivated and purged from public directory.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: true,
  },
  [ACADEMIC_REMARKS.RAD]: {
    ar: 'إعادة قيد',
    en: 'Readmission',
    description: 'Re-activated account mapped to current term.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: false,
  },
  [ACADEMIC_REMARKS.RRG]: {
    ar: 'إعادة تسجيل',
    en: 'Re-registration',
    description: 'Administrative re-enrollment tag.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: false,
  },
  [ACADEMIC_REMARKS.REJ]: {
    ar: 'رفض',
    en: 'Rejected Application',
    description: 'Enrollment request denied.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: true,
  },
  [ACADEMIC_REMARKS.PND]: {
    ar: 'قيد المعالجة',
    en: 'Withheld / Pending',
    description: 'Result withheld or under review; excluded from cohort ranking and mean calculations.',
    excludeFromDenominator: false,
    cappedPoints: null,
    excludedFromRanking: true,
  },
};

/** Rich metadata for a course-level note. */
export function courseNoteInfo(code: CourseNote): AcademicSymbolInfo<CourseNote> {
  return { code, ...COURSE_NOTE_META[code] };
}

/** Rich metadata for a student/year-level remark. */
export function academicRemarkInfo(
  code: AcademicRemark,
): AcademicSymbolInfo<AcademicRemark> {
  return { code, ...REMARK_META[code] };
}

/** Full curated list of course-level symbols grouped + tagged. */
export const COURSE_NOTE_SYMBOLS: AcademicSymbolInfo<CourseNote>[] =
  COURSE_NOTE_CODES.map((code) => courseNoteInfo(code));

/** Full curated list of student/year-level symbols. */
export const ACADEMIC_REMARK_SYMBOLS: AcademicSymbolInfo<AcademicRemark>[] =
  ACADEMIC_REMARK_CODES.map((code) => academicRemarkInfo(code));