/**
 * gpa/calculations.ts — Faculty of Medicine mathematical engine.
 * Pure functions; no I/O. See blueprint 3.1–3.4.
 *
 * Key rules implemented:
 *  - Sup  -> grade points CAPPED at 2.0
 *  - Inc  -> course excluded from the GPA denominator entirely
 *  - PND  -> excluded from cohort math (handled by caller)
 *  - Year GPA is denominator-weighted over a full year
 *  - Progressive weighted CGPA uses YEAR weights (w_k) only over
 *    COMPLETED years (blueprint 3.4 C).
 */

import type { CourseNote, GradeLetter } from './taxonomy';
import { COURSE_NOTES } from './taxonomy';
import { WEIGHTS } from './weights';

const DRY: Record<GradeLetter, number> = {
  A: 4.0,
  'B+': 3.5,
  B: 3.0,
  C: 2.0,
  F: 0.0,
};

/** A single graded course entry (as consumed by the engine). */
export interface CourseGradeInput {
  gradeLetter: GradeLetter | null;
  courseNote?: CourseNote | null;
  credits?: number | null;
}

/** A populated semester holding a list of course grade entries. */
export interface SemesterInput {
  courses: CourseGradeInput[];
}

/**
 * Resolve the effective grade points for a course.
 *  - Sup -> capped at 2.0
 *  - Inc -> null (excluded from numerator AND denominator)
 *  - anything else keeps the raw letter points.
 */
export function pointValue(
  gradeLetter: GradeLetter | null | undefined,
  courseNote: CourseNote | null | undefined = COURSE_NOTES.NONE,
): number | null {
  if (gradeLetter == null) return null;
  const base = DRY[gradeLetter] ?? 0.0;
  if (!courseNote) return base;
  if (courseNote === COURSE_NOTES.INC) return null;
  if (courseNote === COURSE_NOTES.SUP) return Math.min(base, 2.0);
  // Sub, Cro, Rtk, Rst keep raw letter points
  return base;
}

/** Semester GPA over valid courses (blueprint 3.4 A). Excludes Inc credits. */
export function semesterGpa(
  courses: readonly CourseGradeInput[],
): number | null {
  let num = 0;
  let den = 0;
  for (const c of courses) {
    if (!c || !c.credits || c.credits <= 0) continue;
    if (c.courseNote === COURSE_NOTES.INC) continue; // excluded from denom & num
    const p = pointValue(c.gradeLetter, c.courseNote);
    if (p === null || Number.isNaN(p)) continue;
    num += p * c.credits;
    den += c.credits;
  }
  return den === 0 ? null : num / den;
}

/** Year GPA: denominator-weighted over all valid year courses (3.4 B). */
export function yearGpa(semesters: readonly SemesterInput[]): number | null {
  const edges: CourseGradeInput[] = [];
  for (const s of semesters) for (const c of s.courses) edges.push(c);
  return semesterGpa(edges);
}

/**
 * Progressive weighted CGPA over completed years (3.4 C).
 * Weights are the year-level graduation weights (w_k).
 */
export function progressiveCgpa(
  yearGpas: readonly (number | null | undefined)[],
): number | null {
  let num = 0;
  let den = 0;
  for (let k = 0; k < yearGpas.length; k++) {
    const g = yearGpas[k];
    if (g === null || g === undefined || Number.isNaN(g)) continue;
    const w = WEIGHTS[k] ?? 0;
    num += w * g;
    den += w;
  }
  return den === 0 ? null : num / den;
}

/**
 * Provisional estimated CGPA when a year is partial (3.4 D):
 * interim weight = 0.5 * w_k.
 */
export function provisionalEstimatedCgpa(
  officialYears: readonly (number | null | undefined)[],
  nextYearGpa: number | null,
  nextYearIndex: number,
): number | null {
  if (nextYearGpa === null || Number.isNaN(nextYearGpa)) return null;
  const w = WEIGHTS[nextYearIndex] ?? 0;
  const interim = 0.5 * w;
  let num = 0;
  let den = 0;
  for (let k = 0; k < officialYears.length; k++) {
    const g = officialYears[k];
    if (g === null || g === undefined || Number.isNaN(g)) continue;
    num += (WEIGHTS[k] ?? 0) * g;
    den += WEIGHTS[k] ?? 0;
  }
  num += interim * nextYearGpa;
  den += interim;
  return den === 0 ? null : num / den;
}
