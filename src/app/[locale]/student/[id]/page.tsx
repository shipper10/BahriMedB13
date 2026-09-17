import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { TrendingUp } from "lucide-react";

import { createUserSupabaseClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getUserLocale } from "@/i18n/server-locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  TrajectoryChart,
  type TrajectoryPoint,
} from "@/components/charts/trajectory-chart";
import {
  BellCurveChart,
  type GradeBin,
} from "@/components/charts/bell-curve-chart";
import {
  GpaSimulator,
  type CompletedYear,
} from "@/components/student/gpa-simulator";
import { ReportCard } from "@/components/student/report-card";
import { CourseNoteBadge } from "@/components/student/course-note-badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Database } from "@/types/database.types";

/**
 * student/[id]/page.tsx — Phase 6 enhanced student analytics portal.
 *
 * 1. Auth-gated: owner-only read via RLS (Phase 5).
 * 2. Result card with unmasked ID, CGPA, rank & percentile.
 * 3. Recharts trajectory line chart of academic progression.
 * 4. Cohort grade bell-curve per course (admin-aggregated histograms).
 * 5. What-If GPA Simulator for clinical years.
 * 6. Downloadable Report Card as PNG image.
 * 7. Detailed grades table with smart tooltip badges.
 */

function binScore(score: number): string {
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "F";
}
function emptyBins(): GradeBin[] {
  return [
    { band: "A", count: 0 },
    { band: "B+", count: 0 },
    { band: "B", count: 0 },
    { band: "C", count: 0 },
    { band: "F", count: 0 },
  ];
}
export default async function StudentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Student");
  const myLocale = await getUserLocale();

  /* ── auth ── */
  const supabase = await createUserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${myLocale}/login?next=/${myLocale}/student/${id}`);

  /* ── owner-only reads ── */
  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("student_id", id)
    .single();
  if (error || !student) notFound();

  const { data: gpaHistory } = await supabase
    .from("student_gpa_history")
    .select("*")
    .eq("student_id", id)
    .order("semester_id");

  const { data: grades } = await supabase
    .from("student_grades")
    .select(
      "course_code, semester_id, grade_letter, numeric_score, note, is_supplementary, courses:course_code(name_en, name_ar, credit_hours)"
    )
    .eq("student_id", id)
    .order("semester_id");

  /* ── percentile via public view (anon) ── */
  let percentile: number | null = null;
  let latestRank: number | null = null;
  if (gpaHistory && gpaHistory.length > 0) {
    const latest = gpaHistory[gpaHistory.length - 1];
    latestRank = latest.rank_overall;
    if (latestRank != null) {
      const anon = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { count } = await anon
        .from("vw_public_leaderboard")
        .select("*", { count: "exact", head: true })
        .eq("semester_id", latest.semester_id)
        .not("rank_overall", "is", null);
      if (count && count > 0) {
        percentile = Math.round((1 - (latestRank - 1) / count) * 1000) / 10;
      }
    }
  }

  /* ── course distributions (admin, server-only) ── */
  const uniqueCodes = [...new Set((grades ?? []).map((g) => g.course_code))];
  const { data: allScores } =
    uniqueCodes.length > 0
      ? await supabaseAdmin
          .from("student_grades")
          .select("course_code, numeric_score")
          .in("course_code", uniqueCodes)
          .not("numeric_score", "is", null)
      : { data: null };

  const distMap: Record<string, GradeBin[]> = {};
  const allDist = emptyBins();
  if (allScores) {
    for (const s of allScores) {
      if (!distMap[s.course_code]) distMap[s.course_code] = emptyBins();
      const band = binScore(s.numeric_score!);
      const b1 = distMap[s.course_code].find((b) => b.band === band);
      if (b1) b1.count++;
      const b2 = allDist.find((b) => b.band === band);
      if (b2) b2.count++;
    }
  }

  /* ── shape data ── */
  const trajectory: TrajectoryPoint[] = (gpaHistory ?? []).map((r) => ({
    label: r.semester_id,
    semesterGpa: r.semester_gpa,
    yearGpa: r.year_gpa,
    cumulative: r.cumulative_gpa,
  }));
  const ym = new Map<number, number>();
  for (const r of gpaHistory ?? [])
    if (r.year_gpa != null) ym.set(r.year_level, r.year_gpa);
  const completedYears: CompletedYear[] = Array.from({ length: 6 }, (_, i) => ({
    year: i + 1,
    yearGpa: ym.get(i + 1) ?? null,
  }));
  type GR = NonNullable<typeof grades>[number];
  const cName = (r: GR) => {
    const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
    return locale === "ar"
      ? c?.name_ar ?? r.course_code
      : c?.name_en ?? r.course_code;
  };
  const cCredits = (r: GR) =>
    (Array.isArray(r.courses) ? r.courses[0] : r.courses)?.credit_hours ?? null;
  const courseOptions = uniqueCodes.map((code) => {
    const row = (grades ?? []).find((g) => g.course_code === code);
    return { code, name: row ? cName(row) : code };
  });
  const noteDescs: Record<string, string> = {};
  for (const code of ["Sup", "Sub", "Inc", "Cro", "Rtk", "Rst"] as const) {
    noteDescs[code] = t(`notes.${code}`);
  }
  const displayName =
    locale === "ar" ? student.name_ar : student.name_en;
  const latest =
    gpaHistory && gpaHistory.length > 0
      ? gpaHistory[gpaHistory.length - 1]
      : null;

  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* ═══ RESULT CARD ═══ */}
      <Card className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <CardHeader className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("title")}</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                {displayName}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                  {t("id")}: {student.student_id}
                </span>
                <span className="rounded-full bg-secondary/15 px-3 py-1 font-medium text-secondary-foreground">
                  {t("group")}: {student.origin_tag}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
                  {t("status")}: {t(`statusValues.${student.status}`)}
                </span>
              </div>
            </div>
            {latest && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border bg-muted/40 p-3 text-center">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    {t("cgpa")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {latest.cumulative_gpa.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3 text-center">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    {t("overallRank")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {latest.rank_overall != null
                      ? `#${latest.rank_overall}`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3 text-center">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    {t("percentile")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {percentile != null ? `${percentile}%` : "—"}
                  </p>
                </div>
                {latest.year_gpa != null && (
                  <div className="rounded-xl border bg-muted/40 p-3 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">
                      {t("yearGpa")}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {latest.year_gpa.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* ═══ TRAJECTORY CHART ═══ */}
      {trajectory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5 text-primary" />
              {t("trajectoryTitle")}
            </CardTitle>
            <CardDescription>{t("trajectoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <TrajectoryChart
              data={trajectory}
              nameSemester={t("semGpa")}
              nameYear={t("yearGpa")}
              nameCumulative={t("cgpa")}
            />
          </CardContent>
        </Card>
      )}

      {/* ═══ BELL CURVES ═══ */}
      {allDist.some((b) => b.count > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("courseDistTitle")}</CardTitle>
            <CardDescription>{t("courseDistDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full-cohort aggregate */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                {locale === "ar" ? "جميع المواد" : "All Courses"}
              </h3>
              <BellCurveChart
                data={allDist}
                axisStudents={locale === "ar" ? "عدد الطلاب" : "Students"}
              />
            </div>

            {/* Per-course distributions */}
            {courseOptions.length > 0 && (
              <div className="grid gap-4 lg:grid-cols-2">
                {courseOptions.map((course) => {
                  const bins = distMap[course.code];
                  if (!bins || !bins.some((b) => b.count > 0)) return null;
                  return (
                    <div
                      key={course.code}
                      className="rounded-xl border bg-muted/20 p-4"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">{course.name}</h3>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {course.code}
                        </span>
                      </div>
                      <BellCurveChart
                        data={bins}
                        axisStudents={
                          locale === "ar" ? "عدد الطلاب" : "Students"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ SIMULATOR ═══ */}
      <div id="simulator" className="scroll-mt-24">
        <GpaSimulator
          completedYears={completedYears}
          labels={{
            title: t("simulator.title"),
            subtitle: t("simulator.subtitle"),
            year: t("simulator.year"),
            weight: t("simulator.weight"),
            gpa: t("simulator.gpa"),
            completed: t("simulator.completed"),
            predicted: t("simulator.predicted"),
            projectedCgpa: t("simulator.projectedCgpa"),
            currentCgpa: t("simulator.currentCgpa"),
            hint: t("simulator.hint"),
            missing: t("simulator.missing"),
          }}
          clinicalNote={t("simulator.clinicalNote")}
        />
      </div>

      {/* ═══ REPORT CARD ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("reportCardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportCard
            data={{
              fileName: `report-card-${student.student_id}.png`,
              studentName: displayName,
              studentId: student.student_id,
              originTag: student.origin_tag,
              status: t(`statusValues.${student.status}`),
              cgpa: latest ? latest.cumulative_gpa.toFixed(2) : "—",
              yearGpa: latest?.year_gpa?.toFixed(2) ?? null,
              percentile,
              rank: latest?.rank_overall ?? null,
              labels: {
                university:
                  locale === "ar"
                    ? "جامعة بحري — كلية الطب والجراحة"
                    : "University of Bahri — Faculty of Medicine & Surgery",
                batch: t("reportCardTitle"),
                reportCard: t("reportCardTitle"),
                studentName: locale === "ar" ? "الاسم" : "Student Name",
                id: t("id"),
                group: t("group"),
                status: t("status"),
                cgpa: t("cgpa"),
                yearGpa: t("yearGpa"),
                percentile: t("percentile"),
                rank: t("rank"),
                download: t("downloadReportCard"),
                downloading: t("downloading"),
              },
            }}
          />
        </CardContent>
      </Card>

      {/* ═══ GPA HISTORY ═══ */}
      {gpaHistory && gpaHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("gpaTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">{t("semester")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("semGpa")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("yearGpa")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("cgpa")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("rank")}</th>
                  </tr>
                </thead>
                <tbody>
                  {gpaHistory.map((row) => (
                    <tr key={row.semester_id} className="border-b last:border-0">
                      <td className="px-4 py-3">{row.semester_id}</td>
                      <td className="px-4 py-3">{row.semester_gpa?.toFixed(2) ?? "—"}</td>
                      <td className="px-4 py-3">{row.year_gpa?.toFixed(2) ?? "—"}</td>
                      <td className="px-4 py-3 font-medium">{row.cumulative_gpa.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {row.rank_overall !== null ? `#${row.rank_overall}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ COURSE GRADES ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("gradesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {grades && grades.length > 0 ? (() => {
            const bySemester = new Map<string, typeof grades>();
            for (const row of grades) {
              const key = row.semester_id;
              const bucket = bySemester.get(key) ?? [];
              bucket.push(row);
              bySemester.set(key, bucket);
            }

            return (
              <Accordion type="multiple" defaultValue={[...bySemester.keys()].slice(-2)} className="space-y-3">
                {[...bySemester.entries()].map(([semesterId, semesterRows]) => (
                  <AccordionItem key={semesterId} value={semesterId}>
                    <AccordionTrigger className="rounded-xl bg-muted/40 px-4 py-3 text-left">
                      {semesterId}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                          <thead className="border-b bg-muted/50 text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium">{t("course")}</th>
                              <th className="px-4 py-3 text-left font-medium">{t("grade")}</th>
                              <th className="px-4 py-3 text-left font-medium">{t("numericScore")}</th>
                              <th className="px-4 py-3 text-left font-medium">{t("creditHours")}</th>
                              <th className="px-4 py-3 text-left font-medium">{t("note")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semesterRows.map((row, idx) => (
                              <tr
                                key={`${row.course_code}-${row.semester_id}-${idx}`}
                                className="border-b last:border-0"
                              >
                                <td className="px-4 py-3 font-medium">{cName(row)}</td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant={row.grade_letter === "F" ? "destructive" : "default"}
                                  >
                                    {row.grade_letter ?? "—"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">{row.numeric_score ?? "—"}</td>
                                <td className="px-4 py-3">{cCredits(row) ?? "—"}</td>
                                <td className="px-4 py-3">
                                  <CourseNoteBadge
                                    note={row.note}
                                    descriptions={noteDescs as Record<string, string>}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            );
          })() : (
            <p className="text-sm text-muted-foreground">{t("noGrades")}</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}