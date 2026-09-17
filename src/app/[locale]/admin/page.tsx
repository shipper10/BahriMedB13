import { redirect } from "next/navigation";

import { createUserSupabaseClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addAdmin,
  approveGuestRequest,
  blockGroupRegistration,
  rejectGuestRequest,
  resetStudentClaim,
  toggleGroupVisibility,
  toggleStudentRegistrationBlock,
  toggleStudentVisibility,
} from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ studentId?: string }>;
}) {
  const supabase = await createUserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabaseAdmin
    .from("admin_users")
    .select("email")
    .eq("email", user.email ?? "")
    .maybeSingle();

  if (!admin) redirect("/");

  const params = searchParams ? await searchParams : {};
  const studentIdFilter = (params.studentId ?? "").trim();

  const [{ count: studentCount }, { count: claimedCount }, { count: guestCount }, { data: guestRequests }, { data: admins }, { data: students }, { data: searchedStudent }] = await Promise.all([
    supabaseAdmin.from("students").select("student_id", { count: "exact", head: true }),
    supabaseAdmin.from("students").select("student_id", { count: "exact", head: true }).eq("is_claimed", true),
    supabaseAdmin.from("guest_registration_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabaseAdmin.from("guest_registration_requests").select("*").order("created_at", { ascending: false }).limit(20),
    supabaseAdmin.from("admin_users").select("*").order("added_at", { ascending: false }),
    supabaseAdmin.from("students").select("student_id, name_ar, name_en, origin_tag, registration_blocked, leaderboard_visible, is_claimed, auth_user_id").order("student_id").limit(50),
    studentIdFilter
      ? supabaseAdmin
          .from("students")
          .select("student_id, name_ar, name_en, origin_tag, registration_blocked, leaderboard_visible, is_claimed, auth_user_id")
          .eq("student_id", studentIdFilter)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const groupTags = ["23", "24", "legacy_22", "legacy_21"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>إجمالي الطلاب</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{studentCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>المسجّلون</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{claimedCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>طلبات الضيوف</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{guestCount ?? 0}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بحث سريع عن طالب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="flex gap-3">
            <Input name="studentId" defaultValue={studentIdFilter} placeholder="أدخل الرقم الجامعي" className="flex-1" />
            <Button type="submit">بحث</Button>
          </form>

          {searchedStudent && (
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">{searchedStudent.student_id}</p>
                  <h3 className="text-xl font-semibold">{searchedStudent.name_ar ?? searchedStudent.name_en}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={searchedStudent.registration_blocked ? "destructive" : "secondary"}>
                    {searchedStudent.registration_blocked ? "ممنوع" : "مسموح"}
                  </Badge>
                  <Badge variant={searchedStudent.leaderboard_visible ? "default" : "outline"}>
                    {searchedStudent.leaderboard_visible ? "ظاهر" : "مخفي"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <form action={toggleStudentRegistrationBlock.bind(null, searchedStudent.student_id, !searchedStudent.registration_blocked)}>
                  <Button type="submit" variant={searchedStudent.registration_blocked ? "default" : "outline"}>
                    {searchedStudent.registration_blocked ? "رفع المنع" : "منع من التسجيل"}
                  </Button>
                </form>
                <form action={toggleStudentVisibility.bind(null, searchedStudent.student_id, !searchedStudent.leaderboard_visible)}>
                  <Button type="submit" variant={searchedStudent.leaderboard_visible ? "secondary" : "outline"}>
                    {searchedStudent.leaderboard_visible ? "إخفاء من Leaderboard" : "إظهار في Leaderboard"}
                  </Button>
                </form>
                <form action={resetStudentClaim.bind(null, searchedStudent.student_id)}>
                  <Button type="submit" variant="destructive">
                    إلغاء ربط الحساب
                  </Button>
                </form>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إجراءات المجموعات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {groupTags.map((tag) => (
            <div key={tag} className="flex gap-2 rounded-lg border p-2">
              <form action={blockGroupRegistration.bind(null, tag, true)}>
                <Button type="submit" variant="outline">منع {tag}</Button>
              </form>
              <form action={blockGroupRegistration.bind(null, tag, false)}>
                <Button type="submit" variant="secondary">رفع منع {tag}</Button>
              </form>
              <form action={toggleGroupVisibility.bind(null, tag, false)}>
                <Button type="submit" variant="outline">إخفاء {tag}</Button>
              </form>
              <form action={toggleGroupVisibility.bind(null, tag, true)}>
                <Button type="submit" variant="secondary">إظهار {tag}</Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">الرقم</th>
                  <th className="px-3 py-2">الاسم</th>
                  <th className="px-3 py-2">المجموعة</th>
                  <th className="px-3 py-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(students ?? []).map((student) => (
                  <tr key={student.student_id} className="border-t">
                    <td className="px-3 py-2 font-mono">{student.student_id}</td>
                    <td className="px-3 py-2">{student.name_ar ?? student.name_en}</td>
                    <td className="px-3 py-2">{student.origin_tag}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={student.registration_blocked ? "destructive" : "secondary"}>
                          {student.registration_blocked ? "ممنوع" : "مسموح"}
                        </Badge>
                        <Badge variant={student.leaderboard_visible ? "default" : "outline"}>
                          {student.leaderboard_visible ? "ظاهر" : "مخفي"}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>طلبات الضيوف</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">الاسم</th>
                  <th className="px-3 py-2">البريد</th>
                  <th className="px-3 py-2">الحالة</th>
                  <th className="px-3 py-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {(guestRequests ?? []).map((request) => (
                  <tr key={request.id} className="border-t">
                    <td className="px-3 py-2">{request.full_name_ar}</td>
                    <td className="px-3 py-2">{request.email}</td>
                    <td className="px-3 py-2"><Badge>{request.status}</Badge></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <form action={approveGuestRequest.bind(null, request.id, user.email ?? "")}>
                          <Button type="submit" size="sm">قبول</Button>
                        </form>
                        <form action={rejectGuestRequest.bind(null, request.id, user.email ?? "", "غير مناسب") }>
                          <Button type="submit" size="sm" variant="outline">رفض</Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إضافة مشرف</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={async (formData: FormData) => {
            "use server";
            const email = String(formData.get("email") ?? "").trim();
            const displayName = String(formData.get("displayName") ?? "").trim();
            if (email && displayName) await addAdmin(email, displayName);
          }} className="flex gap-3">
            <Input name="email" type="email" placeholder="admin@example.com" className="flex-1" />
            <Input name="displayName" placeholder="اسم المشرف" className="flex-1" />
            <Button type="submit">إضافة</Button>
          </form>

          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">البريد</th>
                  <th className="px-3 py-2">الاسم</th>
                </tr>
              </thead>
              <tbody>
                {(admins ?? []).map((row) => (
                  <tr key={row.email} className="border-t">
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2">{row.display_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
