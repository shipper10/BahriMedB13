import { NextResponse, type NextRequest } from "next/server";

import { parseXlsxBuffer } from "@/lib/excel/parser";
import { COURSE_NOTES } from "@/lib/gpa/taxonomy";
import { createUserSupabaseClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createUserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: admin } = await supabaseAdmin
    .from("admin_users")
    .select("email")
    .eq("email", user.email ?? "")
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const result = parseXlsxBuffer(buffer);

    for (const student of result.students) {
      const { error: studentError } = await supabaseAdmin.from("students").upsert(
        {
          student_id: student.studentId,
          name_ar: student.nameAr,
          name_en: student.nameEn,
          origin_tag: student.originTag,
          status: "active",
          current_year_level: 1,
          registration_blocked: false,
          leaderboard_visible: true,
        },
        { onConflict: "student_id" },
      );

      if (studentError) {
        throw new Error(`Failed to upsert student ${student.studentId}: ${studentError.message}`);
      }

      const { error: deleteError } = await supabaseAdmin.from("student_grades").delete().eq("student_id", student.studentId);
      if (deleteError) {
        throw new Error(`Failed to clear grades for ${student.studentId}: ${deleteError.message}`);
      }

      const gradeRows = student.grades.map((grade) => ({
        student_id: student.studentId,
        course_code: grade.courseCode,
        semester_id: grade.semesterId,
        grade_letter: grade.gradeLetter,
        numeric_score: grade.numericScore,
        note: grade.courseNote || COURSE_NOTES.NONE,
        is_supplementary: grade.courseNote === COURSE_NOTES.SUP,
      }));

      if (gradeRows.length > 0) {
        const { error: gradeError } = await supabaseAdmin.from("student_grades").insert(gradeRows);
        if (gradeError) {
          throw new Error(`Failed to insert grades for ${student.studentId}: ${gradeError.message}`);
        }
      }

      const gpaRows = [
        {
          student_id: student.studentId,
          semester_id: "Y1_S1",
          year_level: 1,
          semester_gpa: student.semester1Gpa ?? null,
          year_gpa: null,
          cumulative_gpa: student.yearGpa ?? 0,
          rank_overall: null,
          rank_origin_cohort: null,
          remark: student.remark,
        },
        {
          student_id: student.studentId,
          semester_id: "Y1_S2",
          year_level: 1,
          semester_gpa: student.semester2Gpa ?? null,
          year_gpa: null,
          cumulative_gpa: student.yearGpa ?? 0,
          rank_overall: null,
          rank_origin_cohort: null,
          remark: student.remark,
        },
      ];

      const { error: gpaError } = await supabaseAdmin.from("student_gpa_history").upsert(gpaRows, {
        onConflict: "student_id,semester_id",
      });

      if (gpaError) {
        throw new Error(`Failed to upsert GPA rows for ${student.studentId}: ${gpaError.message}`);
      }
    }

    return NextResponse.json({ imported: result.totalStudents, ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
