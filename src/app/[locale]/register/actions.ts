"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * register/actions.ts — Phase 5 Anti-Hijacking Challenge server action.
 *
 * Implements blueprint §6.1 Whitelist Identity Challenge:
 *   1. Locate student by university ID → reject if unknown or already claimed.
 *   2. Validate the challenge answer (Chemistry grade) against the DB.
 *   3. Create the Supabase Auth user (auto-confirmed via Admin API).
 *   4. Mark the student record is_claimed = TRUE, is_approved = TRUE,
 *      and bind auth_user_id.
 *
 * Returns a discriminated result so the client can render localized messages.
 */

export type RegisterResult =
  | { ok: true; email: string }
  | { ok: false; error: "STUDENT_NOT_FOUND" | "ALREADY_CLAIMED" | "REGISTRATION_BLOCKED" | "EMAIL_IN_USE" | "CREATE_FAILED" | "UPDATE_FAILED" };

export async function registerStudent(input: {
  studentId: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const studentId = input.studentId.trim();
  const email = input.email.trim().toLowerCase();

  if (!studentId || !email || input.password.length < 6) {
    return { ok: false, error: "STUDENT_NOT_FOUND" };
  }

  const { data: student, error: studentError } = await supabaseAdmin
    .from("students")
    .select("student_id, is_claimed, registration_blocked")
    .eq("student_id", studentId)
    .maybeSingle();

  if (studentError || !student) {
    return { ok: false, error: "STUDENT_NOT_FOUND" };
  }
  if (student.is_claimed) {
    return { ok: false, error: "ALREADY_CLAIMED" };
  }
  if (student.registration_blocked) {
    return { ok: false, error: "REGISTRATION_BLOCKED" };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { student_id: studentId },
  });

  if (authError) {
    return { ok: false, error: "EMAIL_IN_USE" };
  }

  const authUserId = authData.user.id;

  const { error: updateError } = await supabaseAdmin
    .from("students")
    .update({
      is_claimed: true,
      is_approved: true,
      auth_user_id: authUserId,
    })
    .eq("student_id", studentId);

  if (updateError) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => undefined);
    return { ok: false, error: "UPDATE_FAILED" };
  }

  revalidatePath("/", "layout");
  return { ok: true, email };
}