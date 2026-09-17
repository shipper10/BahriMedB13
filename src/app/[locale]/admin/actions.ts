"use server";

import { revalidatePath } from "next/cache";

import { createUserSupabaseClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createUserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("email")
    .eq("email", user.email ?? "")
    .maybeSingle();

  if (!data) throw new Error("Forbidden");
  return user;
}

export async function toggleStudentRegistrationBlock(studentId: string, block: boolean) {
  await requireAdmin();
  await supabaseAdmin
    .from("students")
    .update({ registration_blocked: block })
    .eq("student_id", studentId);
  revalidatePath("/admin");
}

export async function toggleStudentVisibility(studentId: string, visible: boolean) {
  await requireAdmin();
  await supabaseAdmin
    .from("students")
    .update({ leaderboard_visible: visible })
    .eq("student_id", studentId);
  revalidatePath("/");
}

export async function blockGroupRegistration(originTag: string, block: boolean) {
  await requireAdmin();
  await supabaseAdmin
    .from("students")
    .update({ registration_blocked: block })
    .like("origin_tag", `${originTag}%`);
  revalidatePath("/admin");
}

export async function toggleGroupVisibility(originTag: string, visible: boolean) {
  await requireAdmin();
  await supabaseAdmin
    .from("students")
    .update({ leaderboard_visible: visible })
    .like("origin_tag", `${originTag}%`);
  revalidatePath("/");
}

export async function resetStudentClaim(studentId: string) {
  await requireAdmin();
  const { data: student } = await supabaseAdmin
    .from("students")
    .select("auth_user_id")
    .eq("student_id", studentId)
    .maybeSingle();

  if (student?.auth_user_id) {
    await supabaseAdmin.auth.admin.deleteUser(student.auth_user_id).catch(() => undefined);
  }

  await supabaseAdmin
    .from("students")
    .update({ is_claimed: false, is_approved: false, auth_user_id: null })
    .eq("student_id", studentId);

  revalidatePath("/admin");
}

export async function approveGuestRequest(requestId: string, adminEmail: string) {
  await requireAdmin();
  const { data: requestRow } = await supabaseAdmin
    .from("guest_registration_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!requestRow) throw new Error("Request not found");

  const guestId = `GUEST_${requestId.slice(0, 8).toUpperCase()}`;
  await supabaseAdmin.from("students").insert({
    student_id: guestId,
    name_ar: requestRow.full_name_ar,
    name_en: requestRow.full_name_en,
    origin_tag: "guest",
    status: "active",
    is_claimed: false,
    is_approved: true,
  });

  await supabaseAdmin
    .from("guest_registration_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminEmail,
    })
    .eq("id", requestId);

  revalidatePath("/admin");
}

export async function rejectGuestRequest(requestId: string, adminEmail: string, note?: string) {
  await requireAdmin();
  await supabaseAdmin
    .from("guest_registration_requests")
    .update({
      status: "rejected",
      admin_note: note ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminEmail,
    })
    .eq("id", requestId);

  revalidatePath("/admin");
}

export async function addAdmin(email: string, displayName: string) {
  await requireAdmin();
  await supabaseAdmin.from("admin_users").insert({
    email: email.trim(),
    display_name: displayName.trim(),
  });
  revalidatePath("/admin");
}
