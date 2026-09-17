/**
 * scripts/import-grades.ts — Secure, idempotent ingestion pipeline
 * (blueprint §5.2). Reads `multi - Copy.xlsx`, parses it with the shared
 * `lib/excel/parser`, and upserts 269 students + their grades + GPAs into
 * Supabase.
 *
 * Academic rules honoured:
 *  - Sup -> grade points capped at 2.0 (stored via note + is_supplementary)
 *  - Inc -> course credits excluded from the GPA denominator
 *  - remark (academic_remark) carried through to gpa_history
 *
 * Run (Node >= 22, uses the shared TypeScript parser via tsx):
 *   npx tsx scripts/import-grades.ts [path-to-multi-copy.xlsx]
 *
 * Env required (reads `.env.local` automatically):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY   (server-only admin key that bypasses RLS)
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

import {
  SEMESTER1_COURSES,
  SEMESTER2_COURSES,
  parseXlsxFile,
  type ParseResult,
} from '../src/lib/excel/parser';
import { COURSE_NOTES } from '../src/lib/gpa/taxonomy';

/** Unbuffered progress log so the run can be monitored from a file. */
const PROGRESS_FILE = resolve(process.cwd(), 'import-progress.log');
function log(msg: string): void {
  try {
    appendFileSync(PROGRESS_FILE, `${new Date().toISOString()}  ${msg}\n`, 'utf8');
  } catch {
    /* ignore */
  }
  console.log(`[import] ${msg}`);
}

/* ------------------------------------------------------------------ *
 * Minimal .env.local loader (no extra dependency)
 * ------------------------------------------------------------------ */
function loadEnvFiles(): void {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    const p = resolve(file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

/* ------------------------------------------------------------------ *
 * Semester / course seed data
 * ------------------------------------------------------------------ */
const SEMESTERS = [
  {
    semester_id: 'Y1_S1',
    academic_year: '2023-2024',
    year_level: 1,
    semester_num: 1,
    title_ar: 'الفصل الأول — السنة الأولى',
    title_en: 'Year 1 — Semester 1',
    status: 'completed',
  },
  {
    semester_id: 'Y1_S2',
    academic_year: '2023-2024',
    year_level: 1,
    semester_num: 2,
    title_ar: 'الفصل الثاني — السنة الأولى',
    title_en: 'Year 1 — Semester 2',
    status: 'completed',
  },
];

function courseRows(): {
  course_code: string;
  semester_id: string;
  name_ar: string;
  name_en: string;
  credit_hours: number;
}[] {
  const rows: ReturnType<typeof courseRows> = [];
  for (const [semesterId, defs] of Object.entries({
    Y1_S1: SEMESTER1_COURSES,
    Y1_S2: SEMESTER2_COURSES,
  })) {
    for (const def of defs) {
      rows.push({
        course_code: def.code,
        semester_id: semesterId,
        name_ar: def.nameAr,
        name_en: def.nameEn,
        credit_hours: def.creditHours,
      });
    }
  }
  return rows;
}
/* ------------------------------------------------------------------ *
 * Main pipeline
 * ------------------------------------------------------------------ */
async function main(): Promise<void> {
  loadEnvFiles();

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const fileArg = args.find((a) => a !== '--dry-run' && a !== '-n');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dryRun && (!url || !serviceRole)) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.',
    );
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const arg = fileArg ?? resolve(here, '..', 'multi - Copy.xlsx');
  const filePath = isAbsolute(arg) ? arg : resolve(here, arg);

  log(`Parsing ${filePath} …`);
  const result: ParseResult = parseXlsxFile(filePath);
  log(
    `Parsed ${result.totalStudents} students (± Y1 credits ${result.year1Credits}).`,
  );

  if (result.totalStudents === 0) {
    throw new Error('No students parsed — refusing to run.');
  }

  if (dryRun) {
    const tags = new Map<string, number>();
    let gradeRows = 0;
    let s1Gpa = 0;
    let s2Gpa = 0;
    for (const s of result.students) {
      tags.set(s.originTag, (tags.get(s.originTag) ?? 0) + 1);
      gradeRows += s.grades.length;
      s1Gpa += s.semester1Gpa ?? 0;
      s2Gpa += s.semester2Gpa ?? 0;
    }
    log('DRY-RUN — no writes performed.');
    log(`  origin tags: ${JSON.stringify(Object.fromEntries(tags))}`);
    log(`  grade rows ready: ${gradeRows}`);
    log(
      `  mean S1 GPA: ${(s1Gpa / result.totalStudents).toFixed(3)} ` +
        `| mean S2 GPA: ${(s2Gpa / result.totalStudents).toFixed(3)}`,
    );
    return;
  }

  const supabase = createClient(url!, serviceRole!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const step = (msg: string): void => log(msg);

  // 1) Semesters
  step('Upserting semesters…');
  for (const sem of SEMESTERS) {
    const { error } = await supabase.from('semesters').upsert(sem, {
      onConflict: 'semester_id',
    });
    if (error) throw new Error(`semesters upsert failed: ${error.message}`);
  }

  // 2) Courses
  step('Upserting courses…');
  for (const course of courseRows()) {
    const { error } = await supabase.from('courses').upsert(course, {
      onConflict: 'course_code',
    });
    if (error) throw new Error(`courses upsert failed: ${error.message}`);
  }

  // 3) Students (idempotent: preserves existing auth_user_id)
  step('Upserting students…');
  for (const student of result.students) {
    const { error } = await supabase.from('students').upsert(
      {
        student_id: student.studentId,
        name_ar: student.nameAr,
        name_en: student.nameEn,
        origin_tag: student.originTag,
        status: 'active',
        current_year_level: 1,
      },
      { onConflict: 'student_id' },
    );
    if (error) throw new Error(`students upsert failed: ${error.message}`);
  }
// 4) Grades — delete-then-insert per student for clean idempotency.
  step('Upserting grades (delete-then-insert per student)…');
  for (const student of result.students) {
    const { error: delErr } = await supabase
      .from('student_grades')
      .delete()
      .eq('student_id', student.studentId);
    if (delErr) throw new Error(`grade delete failed: ${delErr.message}`);

    const rows = student.grades.map((g) => ({
      student_id: student.studentId,
      course_code: g.courseCode,
      semester_id: g.semesterId,
      grade_letter: g.gradeLetter,
      numeric_score: g.numericScore,
      note: g.courseNote,
      is_supplementary: g.courseNote === COURSE_NOTES.SUP,
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from('student_grades').insert(rows);
      if (error) throw new Error(`grades insert failed: ${error.message}`);
    }
  }

  // 5) GPA history — one row per semester per student.
  step('Upserting GPA history…');
  for (const student of result.students) {
    const entries = [
      {
        student_id: student.studentId,
        semester_id: 'Y1_S1',
        year_level: 1,
        semester_gpa: student.semester1Gpa ?? null,
        year_gpa: null,
        cumulative_gpa: student.semester1Gpa ?? 0,
        remark: student.remark,
      },
      {
        student_id: student.studentId,
        semester_id: 'Y1_S2',
        year_level: 1,
        semester_gpa: student.semester2Gpa ?? null,
        year_gpa: student.yearGpa ?? null,
        cumulative_gpa: student.yearGpa ?? student.semester2Gpa ?? 0,
        remark: student.remark,
      },
    ];
    const { error } = await supabase
      .from('student_gpa_history')
      .upsert(entries, { onConflict: 'student_id,semester_id' });
    if (error) throw new Error(`gpa_history upsert failed: ${error.message}`);
  }

  step(
    `Done. Ingested ${result.totalStudents} students, ${result.students.reduce(
      (a, s) => a + s.grades.length,
      0,
    )} grade rows, ${result.students.length * 2} GPA-history rows.`,
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  log(`FAILED: ${message}`);
  console.error('[import] FAILED:', message);
  process.exitCode = 1;
});