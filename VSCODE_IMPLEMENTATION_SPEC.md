# 📋 مواصفات التعديل الشامل — منصة CAIP Batch 13
## ملف التعليمات الكاملة لـ VS Code / AI Coding Agent

**المشروع:** `BahriMedB13-main` (Next.js 15 + Supabase + TanStack Table v9)  
**الهدف:** تطبيق جميع التعديلات دون كسر الكود الحالي  
**ترتيب التنفيذ:** اتبع الأقسام بالتسلسل — كل قسم مستقل لكن الأقسام الأولى أساس للتالية

---

## ⚠️ قواعد عامة قبل البدء

1. **لا تحذف أي ملف** إلا الملفات المذكورة صراحةً في قسم "الحذف".
2. **أي تعديل على قاعدة البيانات** يجب أن يكون SQL script منفصل يُشغَّل يدوياً في Supabase SQL Editor.
3. **بعد كل تعديل على `database.types.ts`** يجب تحديث النوع يدوياً ليطابق الـ SQL الجديد.
4. **ملفات الترجمة** `ar.json` و `en.json` تُعدَّل دائماً معاً.
5. **لا تغير `PROJECT_BLUEPRINT.md`** — هو مرجع فقط.

---

## القسم أ: إصلاح الأخطاء البرمجية الحرجة

### أ-1: إصلاح `table.state` في TanStack Table v9

**الملف:** `src/components/leaderboard/data-table.tsx`  
**السطر:** 173

```tsx
// ❌ احذف هذا السطر
const activeMetric = COLUMN_METRIC[table.state.sorting[0]?.id] ?? "cgpa";

// ✅ استبدله بهذا
const activeMetric = COLUMN_METRIC[table.getState().sorting[0]?.id] ?? "cgpa";
```

---

### أ-2: إصلاح فلتر المجموعات (Cohort Filter) المعطوب

**المشكلة:** `filterFn` مكتوبة داخل كائن الـ Filter لكنها خاصية خاطئة المكان.

**الملف 1:** `src/components/leaderboard/columns.tsx`  
ابحث عن column `origin_tag` وأضف إليه `filterFn`:

```tsx
columnHelper.accessor("origin_tag", {
  id: "origin_tag",
  header: labels.group,
  enableSorting: false,
  enableGlobalFilter: false,
  filterFn: "cohort",   // ← أضف هذا السطر
  cell: ({ getValue }) => (
    <Badge variant="outline" className="font-mono">
      {getValue<string>()}
    </Badge>
  ),
}),
```

**الملف 2:** `src/components/leaderboard/data-table.tsx`  
في دالة `handleCohortChange`، احذف `filterFn` من كائن الـ filter:

```tsx
// ❌ قبل
return [...without, { id: "origin_tag", value: next, filterFn: "cohort" }];

// ✅ بعد
return [...without, { id: "origin_tag", value: next }];
```

---

### أ-3: إضافة الترتيب الأبجدي للأسماء

**الملف:** `src/components/leaderboard/columns.tsx`  
في column الاسم (`id: "name"`), غيّر `enableSorting: false` إلى `true`:

```tsx
columnHelper.accessor(nameFor, {
  id: "name",
  header: labels.name,
  enableSorting: true,   // ← كانت false، غيّرها إلى true
  sortingFn: (rowA, rowB, columnId) => {
    const a = nameFor(rowA.original) ?? "";
    const b = nameFor(rowB.original) ?? "";
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  },
  // ... باقي الكود كما هو
}),
```

**الملف:** `src/components/leaderboard/data-table.tsx`  
أضف `"name"` لخريطة `METRIC_COLUMN` و `COLUMN_METRIC`:

```tsx
const METRIC_COLUMN: Record<SortMetric, string> = {
  cgpa: "cumulative_gpa",
  year: "year_gpa",
  semester1: "semester_gpa_1",
  semester2: "semester_gpa_2",
  name: "name",           // ← أضف
  course: "cumulative_gpa",
};
```

**الملف:** `src/components/leaderboard/sort-tabs.tsx`  
أضف `name` لنوع `SortMetric`:

```tsx
export type SortMetric =
  | "cgpa" | "year" | "semester1" | "semester2" | "course" | "name"; // ← أضف name
```

وأضف icon له:
```tsx
import { PieChart, CalendarDays, Sun, Moon, BookOpen, ArrowUpAZ } from "lucide-react";

const TAB_ICONS: Record<SortMetric, typeof PieChart> = {
  cgpa: PieChart,
  year: CalendarDays,
  semester1: Sun,
  semester2: Moon,
  course: BookOpen,
  name: ArrowUpAZ,   // ← أضف
};
```

**ملفات الترجمة:**  
في `src/messages/ar.json` داخل `"periods"`:
```json
"name": "أبجدي"
```
في `src/messages/en.json` داخل `"periods"`:
```json
"name": "A–Z"
```

في `data-table.tsx` دالة `sortOptions`، أضف:
```tsx
{ value: "name", label: t("periods.name"), icon: TAB_ICONS.name },
```

---

### أ-4: تقريب المعدل لخانتين بدلاً من ثلاث

ابحث في **جميع الملفات** التالية عن `.toFixed(3)` واستبدله بـ `.toFixed(2)`:

- `src/components/leaderboard/columns.tsx` — دالة `formatGpa`
- `src/app/[locale]/student/[id]/page.tsx` — كل مواضع عرض المعدل
- `src/components/student/gpa-simulator.tsx` — عرض النتيجة

```tsx
// ابحث عن
function formatGpa(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(3);   // ❌
}

// استبدل بـ
function formatGpa(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(2);   // ✅
}
```

كذلك في `student/[id]/page.tsx`:
```tsx
// كل السطور مثل:
latest.cumulative_gpa.toFixed(3)   // ❌ غيّر إلى
latest.cumulative_gpa.toFixed(2)   // ✅
```

---

### أ-5: إصلاح البحث عند تغيير الفلتر

**المشكلة:** البحث المكتوب لا ينفَّذ عند تغيير فلتر المجموعة.

**الملف:** `src/components/leaderboard/data-table.tsx`

في دالة `handleCohortChange`، أضف إعادة تطبيق البحث بعد تغيير الفلتر:

```tsx
const handleCohortChange = useCallback(
  (next: CohortFilterValue) => {
    setCohort(next);
    if (next === "all") {
      table.setColumnFilters((prev) =>
        prev.filter((f) => f.id !== "origin_tag")
      );
    } else {
      table.setColumnFilters((prev) => {
        const without = prev.filter((f) => f.id !== "origin_tag");
        return [...without, { id: "origin_tag", value: next }];
      });
    }
    // ← أضف هذا السطر: إعادة تطبيق البحث الحالي
    if (search.trim()) {
      table.setGlobalFilter(search);
    }
  },
  [table, search]   // ← أضف search لـ dependencies
);
```

---

### أ-6: إضافة عمود الترتيب (#1, #2) في جدول Leaderboard

**الملف:** `src/components/leaderboard/columns.tsx`

أضف `rank_overall` لـ `LeaderboardRow` interface:
```tsx
export interface LeaderboardRow {
  // ... الحقول الموجودة
  rank_overall: number | null;   // ← أضف هذا
}
```

أضف عمود الترتيب في `buildLeaderboardColumns` (أول عمود):
```tsx
columnHelper.accessor("rank_overall", {
  id: "rank_overall",
  header: "#",
  enableSorting: false,
  cell: ({ getValue }) => {
    const v = getValue<number | null>();
    return v != null ? (
      <span className="font-bold tabular-nums text-primary">#{v}</span>
    ) : "—";
  },
  meta: { className: "w-12 text-center" },
}),
```

**الملف:** `src/components/leaderboard/leaderboard-transform.ts`

في دالة `transformLeaderboardRows`، أضف الحقل:
```tsx
result.push({
  // ... الحقول الموجودة
  rank_overall: pickLast(group, "rank_overall") as number | null,  // ← أضف
});
```

---

## القسم ب: تحسينات العرض على الجوال

### ب-1: تقصير الاسم في الجدول

**الملف:** `src/components/leaderboard/columns.tsx`

غيّر cell الاسم ليعرض كلمتين فقط على الشاشات الصغيرة:

```tsx
cell: ({ row }) => {
  const fullName = nameFor(row.original);
  // خذ أول كلمتين فقط
  const shortName = fullName.split(" ").slice(0, 2).join(" ");
  return (
    <div className="min-w-[7rem] max-w-[14rem]">
      {/* على الجوال: اسم مقصور. على الحاسوب: الاسم الكامل */}
      <span className="block truncate font-medium text-foreground md:hidden">
        {shortName}
      </span>
      <span className="hidden truncate font-medium text-foreground md:block">
        {fullName}
      </span>
    </div>
  );
},
```

---

### ب-2: إخفاء أعمدة ثانوية على الجوال

**الملف:** `src/components/leaderboard/data-table.tsx`

في `initialState`، أضف `columnVisibility` لإخفاء بعض الأعمدة على الجوال:

```tsx
initialState: {
  sorting: [{ id: "cumulative_gpa", desc: true }],
  globalFilter: "",
  columnPinning: { start: ["rank_overall", "masked_id", "name"], end: [] },
  columnFilters: [],
  // أضف هذا:
  columnVisibility: {
    // الأعمدة التالية ستُخفى على الجوال وتظهر على الحاسوب
    // سيتم التحكم بها بـ JS أدناه
  },
},
```

أضف هذا `useEffect` في الـ component بعد تعريف `table`:

```tsx
// إخفاء الأعمدة الثانوية تلقائياً على الجوال
React.useEffect(() => {
  const handler = () => {
    const isMobile = window.innerWidth < 768;
    table.setColumnVisibility({
      status: !isMobile,
      origin_tag: !isMobile,
      semester_gpa_1: !isMobile,
      semester_gpa_2: !isMobile,
    });
  };
  handler();
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}, [table]);
```

> **ملاحظة:** تأكد من import `React` في أعلى الملف.

---

### ب-3: إضافة مؤشر تمرير أفقي (Drop Shadow)

**الملف:** `src/components/leaderboard/data-table.tsx`

غيّر div الجدول من:
```tsx
<div className="max-h-[65vh] overflow-auto">
```
إلى:
```tsx
<div className="max-h-[65vh] overflow-auto [mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)] md:[mask-image:none]">
```

أو بديل أوضح — أضف wrapper:
```tsx
<div className="relative">
  <div className="max-h-[65vh] overflow-auto" id="leaderboard-scroll">
    {/* الجدول */}
  </div>
  {/* مؤشر التمرير للجهة */}
  <div className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-s from-card md:hidden" />
</div>
```

---

## القسم ج: تعديل نظام المصادقة

### ج-1: حذف سؤال التحقق (Chemistry Challenge) من التسجيل

**قرار التصميم:** نستبدل التحقق بالدرجة بـ "التحقق برقم الجامعي فقط + البريد + كلمة السر". هذا أبسط وأكثر واقعية.

**الملف:** `src/app/[locale]/register/actions.ts`

احذف الخطوة 2 كاملة (التحقق من درجة الكيمياء):

```typescript
export async function registerStudent(input: {
  studentId: string;
  email: string;
  password: string;
  // ← احذف challengeAnswer من هنا
}): Promise<RegisterResult> {
  const studentId = input.studentId.trim();
  const email = input.email.trim().toLowerCase();

  if (!studentId || !email || input.password.length < 6) {
    return { ok: false, error: "CHALLENGE_MISMATCH" };
  }

  // 1) Locate student
  const { data: student, error: studentError } = await supabaseAdmin
    .from("students")
    .select("student_id, is_claimed, registration_blocked")  // ← أضف registration_blocked
    .eq("student_id", studentId)
    .maybeSingle();

  if (studentError || !student) return { ok: false, error: "STUDENT_NOT_FOUND" };
  if (student.is_claimed) return { ok: false, error: "ALREADY_CLAIMED" };
  
  // ← أضف هذا الفحص الجديد
  if (student.registration_blocked) return { ok: false, error: "REGISTRATION_BLOCKED" };

  // ← احذف الخطوة 2 (CHM grade check) بالكامل

  // 3) Create auth user (كانت خطوة 3، صارت 2)
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { student_id: studentId },
    });

  if (authError) return { ok: false, error: "EMAIL_IN_USE" };

  // 4) Bind student record (كانت خطوة 4، صارت 3)
  const { error: updateError } = await supabaseAdmin
    .from("students")
    .update({ is_claimed: true, is_approved: true, auth_user_id: authData.user.id })
    .eq("student_id", studentId);

  if (updateError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => undefined);
    return { ok: false, error: "UPDATE_FAILED" };
  }

  revalidatePath("/", "layout");
  return { ok: true, email };
}
```

أضف `"REGISTRATION_BLOCKED"` لنوع `RegisterResult`:
```typescript
export type RegisterResult =
  | { ok: true; email: string }
  | { ok: false; error: "STUDENT_NOT_FOUND" | "ALREADY_CLAIMED" | "REGISTRATION_BLOCKED" | "EMAIL_IN_USE" | "CREATE_FAILED" | "UPDATE_FAILED" };
```

**الملف:** `src/app/[locale]/register/register-form.tsx`

احذف كل ما يتعلق بـ `challengeAnswer` و `challengeQuestion` و `grades` من الـ form.

**ملفات الترجمة** — أضف رسالة خطأ جديدة:  
في `ar.json`:
```json
"REGISTRATION_BLOCKED": "هذا الرقم الجامعي ممنوع من التسجيل مؤقتاً. تواصل مع المشرف."
```
في `en.json`:
```json
"REGISTRATION_BLOCKED": "This student ID is currently blocked from registration. Contact the admin."
```

---

### ج-2: إضافة "نسيت كلمة السر" (Password Reset)

**ملف جديد:** `src/app/[locale]/forgot-password/page.tsx`

```tsx
import { ForgotPasswordForm } from "./forgot-password-form";
import { getTranslations } from "next-intl/server";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("Auth.forgotPassword");
  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-12">
      <ForgotPasswordForm
        title={t("title")}
        subtitle={t("subtitle")}
        emailLabel={t("email")}
        submitLabel={t("submit")}
        successMessage={t("success")}
        backToLogin={t("backToLogin")}
      />
    </section>
  );
}
```

**ملف جديد:** `src/app/[locale]/forgot-password/forgot-password-form.tsx`

```tsx
"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { Loader2, Mail } from "lucide-react";

interface Props {
  title: string; subtitle: string; emailLabel: string;
  submitLabel: string; successMessage: string; backToLogin: string;
}

export function ForgotPasswordForm({ title, subtitle, emailLabel, submitLabel, successMessage, backToLogin }: Props) {
  const [email, setEmail] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      // Supabase يرسل رابط إعادة التعيين تلقائياً
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      setDone(true); // نعرض نجاح دائماً (أمان — لا نكشف هل البريد موجود)
    });
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Mail className="size-6" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-600 dark:text-emerald-400">
            {successMessage}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{emailLabel}</Label>
              <Input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required dir="ltr" />
            </div>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            {backToLogin}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

**ملف جديد:** `src/app/[locale]/auth/callback/route.ts`
```typescript
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  
  if (code && type === "recovery") {
    // وجّه لصفحة إعادة تعيين كلمة السر
    return NextResponse.redirect(`${origin}/ar/reset-password?code=${code}`);
  }
  return NextResponse.redirect(`${origin}/ar`);
}
```

**ملف جديد:** `src/app/[locale]/reset-password/page.tsx` — صفحة إدخال كلمة السر الجديدة (بنفس نمط forgot-password-form).

**أضف في ملفات الترجمة** داخل `"Auth"`:
```json
"forgotPassword": {
  "title": "استعادة كلمة السر",
  "subtitle": "أدخل بريدك الإلكتروني وسنرسل لك رابط الاسترداد",
  "email": "البريد الإلكتروني",
  "submit": "إرسال رابط الاسترداد",
  "success": "تم الإرسال! تحقق من بريدك الإلكتروني وافتح الرابط.",
  "backToLogin": "العودة لتسجيل الدخول"
}
```

**أضف رابط "نسيت كلمة السر؟"** في `login-form.tsx` تحت زر Submit:
```tsx
<p className="text-center text-sm text-muted-foreground">
  <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
    {t("forgotPassword")}
  </Link>
</p>
```

---

## القسم د: تعديلات قاعدة البيانات (SQL — شغّل في Supabase)

### د-1: إضافة أعمدة التحكم في التسجيل والظهور

```sql
-- أضف عمودَي التحكم لجدول الطلاب
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS registration_blocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN DEFAULT TRUE;

-- فهرس للأداء
CREATE INDEX IF NOT EXISTS idx_students_reg_blocked 
  ON public.students(registration_blocked) WHERE registration_blocked = TRUE;
CREATE INDEX IF NOT EXISTS idx_students_visibility 
  ON public.students(leaderboard_visible) WHERE leaderboard_visible = FALSE;
```

### د-2: جدول طلبات التسجيل الخارجية (Guest Requests)

```sql
CREATE TABLE IF NOT EXISTS public.guest_registration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name_ar TEXT NOT NULL,
  full_name_en TEXT NOT NULL,
  email TEXT NOT NULL,
  reason TEXT,                         -- سبب الطلب
  status TEXT DEFAULT 'pending'        -- 'pending' | 'approved' | 'rejected'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,                     -- ملاحظة المشرف عند الرفض
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT                     -- بريد المشرف الذي راجع الطلب
);

-- صلاحيات: أي زائر يستطيع الإضافة، فقط المشرف يقرأ/يعدّل
ALTER TABLE public.guest_registration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit guest request" 
  ON public.guest_registration_requests FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admin reads guest requests" 
  ON public.guest_registration_requests FOR ALL 
  USING (auth.jwt() ->> 'email' = 'admin@bahri.edu.sd');
```

### د-3: جدول المشرفين (Multi-Admin Support)

```sql
CREATE TABLE IF NOT EXISTS public.admin_users (
  email TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  permissions JSONB DEFAULT '{
    "manage_students": true,
    "upload_grades": true,
    "manage_settings": true,
    "manage_admins": false
  }',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by TEXT
);

-- إضافة المشرف الأول
INSERT INTO public.admin_users (email, display_name, added_by)
VALUES ('admin@bahri.edu.sd', 'المشرف الرئيسي', 'system')
ON CONFLICT (email) DO NOTHING;

-- دالة للتحقق من كون المستخدم مشرفاً
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.jwt() ->> 'email'
  );
$$;

-- تحديث سياسات RLS لاستخدام الجدول الجديد بدل الإيميل الثابت
-- مثال:
DROP POLICY IF EXISTS "Admin full access students" ON public.students;
CREATE POLICY "Admin full access students" ON public.students
  FOR ALL USING (public.is_admin());
```

### د-4: تحديث `database.types.ts`

أضف يدوياً للـ types:
```typescript
// في Tables:
guest_registration_requests: {
  Row: {
    id: string;
    full_name_ar: string;
    full_name_en: string;
    email: string;
    reason: string | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    created_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
  };
  Insert: { /* نفس Row لكن كل الحقول اختيارية ما عدا الأسماء والبريد */ };
  Update: { /* نفس Insert */ };
};

admin_users: {
  Row: {
    email: string;
    display_name: string;
    permissions: { manage_students: boolean; upload_grades: boolean; manage_settings: boolean; manage_admins: boolean };
    added_at: string;
    added_by: string | null;
  };
  Insert: Partial<Row> & { email: string; display_name: string };
  Update: Partial<Row>;
};
```

وفي `students.Row` أضف الحقلين الجديدين:
```typescript
registration_blocked: boolean;
leaderboard_visible: boolean;
```

---

## القسم هـ: جعل لوحة الترتيب تتطلب تسجيل الدخول

**القرار:** الصفحة الرئيسية `/` تعرض landing page للزوار غير المسجَّلين. الـ Leaderboard يظهر فقط للمسجَّلين.

**الملف:** `src/app/[locale]/page.tsx`

```tsx
import { redirect } from "next/navigation";
import { createUserSupabaseClient } from "@/lib/supabase/server-auth";
import { getUserLocale } from "@/i18n/server-locale";
// ... باقي الـ imports

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // ← أضف فحص المصادقة
  const supabase = await createUserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // إذا لم يكن مسجلاً، أعرض landing page بدون بيانات
  if (!user) {
    return <LandingPage locale={locale} />;  // ← صفحة ترحيبية
  }

  // ... باقي الكود الحالي للمسجَّلين
}

// ← أضف component للـ Landing Page
function LandingPage({ locale }: { locale: string }) {
  // صفحة بسيطة مع Hero + أزرار تسجيل دخول وتسجيل
  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
          منصة تحليلات الدفعة 13
        </h1>
        <p className="text-lg text-muted-foreground">
          كلية الطب والجراحة — جامعة بحري
        </p>
        <p className="text-muted-foreground">
          سجّل دخولك للوصول إلى لوحة الترتيب وملفك الأكاديمي
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/login">تسجيل الدخول</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/register">إنشاء حساب</Link>
        </Button>
      </div>
    </section>
  );
}
```

---

## القسم و: لوحة تحكم المشرف (Admin Module)

### و-1: Layout للإدارة مع حماية المسار

**ملف جديد:** `src/app/[locale]/admin/layout.tsx`

```tsx
import { redirect } from "next/navigation";
import { createUserSupabaseClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getUserLocale } from "@/i18n/server-locale";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getUserLocale();
  const supabase = await createUserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect(`/${locale}/login`);
  
  // تحقق من وجود البريد في جدول المشرفين
  const { data: admin } = await supabaseAdmin
    .from("admin_users")
    .select("email")
    .eq("email", user.email ?? "")
    .maybeSingle();
  
  if (!admin) redirect(`/${locale}`);  // ليس مشرفاً
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Admin</span>
      </div>
      {children}
    </div>
  );
}
```

### و-2: الصفحة الرئيسية للإدارة

**ملف جديد:** `src/app/[locale]/admin/page.tsx`

يجب أن تحتوي على:

1. **إحصائيات سريعة:** عدد الطلاب، عدد المسجَّلين، عدد طلبات الضيوف المعلقة.
2. **بحث عن طالب برقمه** + عرض حالته + أزرار:
   - "منع من التسجيل / رفع المنع" (toggle `registration_blocked`)
   - "إخفاء من Leaderboard / إظهار" (toggle `leaderboard_visible`)
   - "إلغاء ربط الحساب" (reset `is_claimed=false`, `auth_user_id=null`)
3. **فلترة جماعية بالمجموعة:**
   - زر "منع مجموعة 23 / 24 / المنضمون من التسجيل"
   - زر "إخفاء/إظهار مجموعة كاملة من الـ Leaderboard"
4. **جدول طلبات الضيوف** مع زر قبول/رفض لكل طلب.
5. **جدول المشرفين** مع زر إضافة مشرف جديد.

**Server Actions للإدارة** — ملف جديد: `src/app/[locale]/admin/actions.ts`

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createUserSupabaseClient } from "@/lib/supabase/server-auth";

// دالة مساعدة للتحقق من صلاحية المشرف
async function requireAdmin() {
  const supabase = await createUserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data } = await supabaseAdmin
    .from("admin_users").select("email").eq("email", user.email ?? "").maybeSingle();
  if (!data) throw new Error("Forbidden");
  return user;
}

/** منع/رفع منع طالب من التسجيل */
export async function toggleStudentRegistrationBlock(studentId: string, block: boolean) {
  await requireAdmin();
  await supabaseAdmin.from("students")
    .update({ registration_blocked: block })
    .eq("student_id", studentId);
  revalidatePath("/admin");
}

/** إخفاء/إظهار طالب من Leaderboard */
export async function toggleStudentVisibility(studentId: string, visible: boolean) {
  await requireAdmin();
  await supabaseAdmin.from("students")
    .update({ leaderboard_visible: visible })
    .eq("student_id", studentId);
  revalidatePath("/");
}

/** منع مجموعة كاملة من التسجيل */
export async function blockGroupRegistration(originTag: string, block: boolean) {
  await requireAdmin();
  // origin_tag يكون '23', '24', 'legacy_22', 'legacy_21'
  await supabaseAdmin.from("students")
    .update({ registration_blocked: block })
    .like("origin_tag", `${originTag}%`);  // يشمل '23', 'legacy_23' إلخ
  revalidatePath("/admin");
}

/** إخفاء/إظهار مجموعة كاملة من Leaderboard */
export async function toggleGroupVisibility(originTag: string, visible: boolean) {
  await requireAdmin();
  await supabaseAdmin.from("students")
    .update({ leaderboard_visible: visible })
    .like("origin_tag", `${originTag}%`);
  revalidatePath("/");
}

/** إلغاء ربط حساب طالب (يسمح له بالتسجيل مجدداً) */
export async function resetStudentClaim(studentId: string) {
  await requireAdmin();
  // احذف مستخدم الـ auth أيضاً إذا وُجد
  const { data: student } = await supabaseAdmin
    .from("students").select("auth_user_id").eq("student_id", studentId).maybeSingle();
  if (student?.auth_user_id) {
    await supabaseAdmin.auth.admin.deleteUser(student.auth_user_id).catch(() => undefined);
  }
  await supabaseAdmin.from("students")
    .update({ is_claimed: false, is_approved: false, auth_user_id: null })
    .eq("student_id", studentId);
  revalidatePath("/admin");
}

/** قبول طلب ضيف */
export async function approveGuestRequest(requestId: string, adminEmail: string) {
  await requireAdmin();
  // 1) اجلب الطلب
  const { data: req } = await supabaseAdmin
    .from("guest_registration_requests").select("*").eq("id", requestId).single();
  if (!req) throw new Error("Request not found");
  // 2) أنشئ سجل في students بـ student_id مؤلف من GUEST_ + UUID مختصر
  const guestId = `GUEST_${requestId.slice(0, 8).toUpperCase()}`;
  await supabaseAdmin.from("students").insert({
    student_id: guestId,
    name_ar: req.full_name_ar,
    name_en: req.full_name_en,
    origin_tag: "guest",
    status: "active",
  });
  // 3) حدّث حالة الطلب
  await supabaseAdmin.from("guest_registration_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: adminEmail })
    .eq("id", requestId);
  revalidatePath("/admin");
}

/** رفض طلب ضيف */
export async function rejectGuestRequest(requestId: string, adminEmail: string, note?: string) {
  await requireAdmin();
  await supabaseAdmin.from("guest_registration_requests")
    .update({ status: "rejected", admin_note: note ?? null, 
              reviewed_at: new Date().toISOString(), reviewed_by: adminEmail })
    .eq("id", requestId);
  revalidatePath("/admin");
}

/** إضافة مشرف جديد */
export async function addAdmin(email: string, displayName: string) {
  await requireAdmin();
  await supabaseAdmin.from("admin_users").insert({ email, display_name: displayName });
  revalidatePath("/admin");
}
```

### و-3: صفحة رفع الدرجات

**ملف جديد:** `src/app/[locale]/admin/upload/page.tsx`

```tsx
"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AdminUploadPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");

  async function handleUpload() {
    if (!file) return;
    setStatus("loading");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/ingest-excel", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      setMessage(`تم استيراد ${data.imported} طالب بنجاح`);
    } else {
      setStatus("error");
      setMessage(data.error ?? "حدث خطأ أثناء الاستيراد");
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>رفع ملف الدرجات (Excel)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition hover:border-primary/60"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0] ?? null); }}
        >
          <Upload className="mb-3 size-10 text-primary/50" />
          <p className="text-sm text-muted-foreground">اسحب ملف xlsx هنا أو</p>
          <label className="mt-2 cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline">
            اختر ملفاً
            <input type="file" accept=".xlsx" className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {file && <p className="mt-2 text-xs text-muted-foreground">{file.name}</p>}
        </div>
        {status === "success" && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle className="size-4" /> {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4" /> {message}
          </div>
        )}
        <Button onClick={handleUpload} disabled={!file || status === "loading"} className="w-full">
          {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          رفع وتحديث قاعدة البيانات
        </Button>
      </CardContent>
    </Card>
  );
}
```

### و-4: API Route لاستيراد Excel

**ملف جديد:** `src/app/api/ingest-excel/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createUserSupabaseClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { parseXlsxBuffer } from "@/lib/excel/parser";
// استيراد منطق الـ upsert من import-grades.ts كـ functions مستقلة

export async function POST(request: NextRequest) {
  // 1) تحقق من المشرف
  const supabase = await createUserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { data: admin } = await supabaseAdmin
    .from("admin_users").select("email").eq("email", user.email ?? "").maybeSingle();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 2) اقرأ الملف
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  try {
    const buffer = await file.arrayBuffer();
    const result = parseXlsxBuffer(buffer);
    
    // 3) Upsert البيانات (نفس منطق import-grades.ts)
    // ... (انقل منطق الـ upsert من scripts/import-grades.ts هنا)
    
    return NextResponse.json({ imported: result.totalStudents, ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
```

---

## القسم ز: تسجيل الضيوف الخارجيين

### ز-1: إضافة خيار "طالب ضيف" في صفحة التسجيل

**الملف:** `src/app/[locale]/register/page.tsx`

أضف tabs أو أزرار تبديل بين "طالب الدفعة" و "طالب ضيف":

في الـ Guest form، المستخدم يُدخل:
- الاسم بالعربي
- الاسم بالإنجليزي
- بريد إلكتروني
- سبب الطلب (اختياري)

**ملف جديد:** `src/app/[locale]/register/guest-form.tsx`

```tsx
"use client";
import * as React from "react";
import { supabaseAdmin } from "@/lib/supabase/client";  // ← استخدم anon client
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";

export function GuestRegistrationForm() {
  const [isPending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      // استخدم anon client — الـ RLS policy تسمح للجميع بالإدخال
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await client.from("guest_registration_requests").insert({
        full_name_ar: String(fd.get("name_ar")),
        full_name_en: String(fd.get("name_en")),
        email: String(fd.get("email")),
        reason: String(fd.get("reason") ?? ""),
      });
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6 text-center text-sm text-emerald-700 dark:text-emerald-300">
        تم إرسال طلبك! سيتواصل معك المشرف بعد المراجعة.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>طلب تسجيل ضيف</CardTitle>
        <CardDescription>لمن ليس لديه رقم جامعي في الدفعة 13</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>الاسم بالعربية</Label>
            <Input name="name_ar" required placeholder="محمد أحمد" />
          </div>
          <div className="grid gap-2">
            <Label>الاسم بالإنجليزية</Label>
            <Input name="name_en" required placeholder="Mohammed Ahmed" dir="ltr" />
          </div>
          <div className="grid gap-2">
            <Label>البريد الإلكتروني</Label>
            <Input name="email" type="email" required dir="ltr" />
          </div>
          <div className="grid gap-2">
            <Label>سبب الطلب (اختياري)</Label>
            <Input name="reason" placeholder="مثال: طالب منقول من دفعة أخرى" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            إرسال طلب التسجيل
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## القسم ح: تحسين صفحة الطالب (عرض المواد)

### ح-1: عرض المواد مجمّعة حسب السنة والفصل

**الملف:** `src/app/[locale]/student/[id]/page.tsx`

استبدل جدول المواد الحالي بعرض متجمّع بالسنة/الفصل. أضف `accordion.tsx` من shadcn:

```bash
# شغّل هذا الأمر في Terminal لإضافة Accordion
npx shadcn@latest add accordion
```

ثم غيّر قسم "COURSE GRADES" في صفحة الطالب:

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

{/* بدلاً من الجدول المسطّح، اجمع المواد حسب semester_id */}
{grades && grades.length > 0 && (() => {
  // جمّع حسب الفصل
  const bySemester = new Map<string, typeof grades>();
  for (const g of grades) {
    const list = bySemester.get(g.semester_id) ?? [];
    list.push(g);
    bySemester.set(g.semester_id, list);
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("gradesTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={[...bySemester.keys()].slice(-2)}>
          {[...bySemester.entries()].map(([semId, semGrades]) => (
            <AccordionItem key={semId} value={semId}>
              <AccordionTrigger className="text-sm font-semibold">
                {semId}  {/* سيظهر Y1_S1 → يمكن تنسيقه لاحقاً */}
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-start font-medium">{t("course")}</th>
                        <th className="px-4 py-2 text-center font-medium">{t("grade")}</th>
                        <th className="px-4 py-2 text-center font-medium">{t("numericScore")}</th>
                        <th className="px-4 py-2 text-center font-medium">{t("creditHours")}</th>
                        <th className="px-4 py-2 text-center font-medium">{t("note")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semGrades.map((row, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-4 py-2 font-medium">{cName(row)}</td>
                          <td className="px-4 py-2 text-center">
                            <Badge variant={row.grade_letter === "F" ? "destructive" : "default"}>
                              {row.grade_letter ?? "—"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-center tabular-nums">{row.numeric_score ?? "—"}</td>
                          <td className="px-4 py-2 text-center tabular-nums">{cCredits(row) ?? "—"}</td>
                          <td className="px-4 py-2 text-center">
                            <CourseNoteBadge note={row.note} descriptions={noteDescs} />
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
      </CardContent>
    </Card>
  );
})()}
```

---

## القسم ط: تحديث Navbar ليتفاعل مع المصادقة

**المشكلة:** Navbar يعرض دائماً "تسجيل دخول / تسجيل" بغض النظر عن الحالة.

**الحل:** حوّل layout.tsx لتمرير معلومات المستخدم للـ Navbar.

**الملف:** `src/app/[locale]/layout.tsx`

```tsx
// أضف هذا الاستيراد
import { createUserSupabaseClient } from "@/lib/supabase/server-auth";

// داخل LocaleLayout
const supabase = await createUserSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();

// اجلب student_id المرتبط بالمستخدم إذا وُجد
let studentId: string | null = null;
if (user) {
  const { data } = await supabase
    .from("students")
    .select("student_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  studentId = data?.student_id ?? null;
}

// مرّر للـ Navbar
<Navbar userEmail={user?.email ?? null} studentId={studentId} />
```

**الملف:** `src/components/shared/navbar.tsx`

أضف props:
```tsx
interface NavbarProps {
  userEmail: string | null;
  studentId: string | null;
}

export function Navbar({ userEmail, studentId }: NavbarProps) {
  // ...

  // في قسم الـ Actions، استبدل الأزرار بـ:
  <div className="hidden items-center gap-1.5 sm:flex">
    {userEmail ? (
      // المستخدم مسجَّل الدخول
      <>
        {studentId && (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/student/${studentId}`}>{t("nav.myProfile")}</Link>
          </Button>
        )}
        <LogoutButton />
      </>
    ) : (
      // غير مسجَّل
      <>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">{t("nav.login")}</Link>
        </Button>
        <Button asChild variant="default" size="sm">
          <Link href="/register">{t("nav.register")}</Link>
        </Button>
      </>
    )}
  </div>
```

**ملف جديد:** `src/components/shared/logout-button.tsx`

```tsx
"use client";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const locale = useLocale();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="size-4" />
      خروج
    </Button>
  );
}
```

أضف في ملفات الترجمة:
```json
"nav": { "myProfile": "ملفي الأكاديمي" }
```

---

## القسم ي: حذف الملفات الزائدة

### الملفات التي يجب حذفها من مجلد `scripts/`:
```
__reprobe1.cjs       _act_userB.cjs      _cprobe.cjs
_depstate.cjs        _final_probe.cjs    _fprobe77.cjs
_inspect2.cjs        _inspect3.cjs       _inspect_excel2.cjs
_install_driver.cjs  _install_run2.cjs   _install_runner.cjs
_installdrv.cjs      _layout5.cjs        _layout_probe.cjs
_layoutprobe_ok.cjs  _probe10.cjs        _probe9.cjs
_probeAAA.cjs        _probe_dep.cjs      _x22.cjs
_x55probe.cjs        _xlsx_probe.cjs     clean_probe_x.cjs
probex.cjs           viewcheck.cjs
```

### أضف لـ `.gitignore`:
```
# Data files
*.xlsx
viewcheck.txt
import-progress.log
```

---

## القسم ك: ملاحظات مستقبلية وتوقعات المشاكل

### ك-1: إضافة سنوات وفصول جديدة

**الوضع الحالي:** المواد والفصول مُرمَّزة في parser.ts بشكل ثابت (Y1_S1, Y1_S2 فقط).

**عند إضافة سنة 2 (Y2):**
1. أضف الفصول الجديدة في `src/lib/excel/parser.ts` — `SEMESTER_COURSES`:
   ```typescript
   Y2_S1: [...], // مع columns جديدة
   Y2_S2: [...],
   ```
2. شغّل الـ SQL في Supabase لإضافة صفوف في `semesters` و `courses`.
3. أضف ترجمات المواد الجديدة في `ar.json` و `en.json` (الأسماء العربية).
4. شغّل `import-grades.ts` أو ارفع الملف من لوحة التحكم.

**لا يحتاج أي تغيير** في قاعدة البيانات (مصمَّمة للـ 6 سنوات من البداية).

### ك-2: مشاكل الأداء المتوقعة عند اكتمال الـ 6 سنوات

**المشكلة:** `vw_public_leaderboard` ستعيد آلاف الصفوف (269 طالب × 12 فصل = ~3200 صف).

**الحل المستقبلي:** أضف pagination في الـ Leaderboard:
```tsx
// في leaderboard-section.tsx أضف .range(0, 49) للصفحة الأولى
.from("vw_public_leaderboard").select("*").order("cumulative_gpa", { ascending: false }).range(0, 49)
```

### ك-3: نسخ احتياطي للبيانات

**الحل:** Supabase يوفر نسخاً احتياطية تلقائية في الخطط المدفوعة. للمجاني، اضغط يدوياً:
`Supabase Dashboard → Project → Database → Backups`.

أو أضف script بسيط:
```bash
# في package.json
"backup": "npx supabase db dump -f backup-$(date +%Y%m%d).sql"
```

### ك-4: الأمان — الأرقام الجامعية المتسلسلة

بعد حذف سؤال الكيمياء، حماية التسجيل تعتمد على **السرية** (لا أحد يعرف أرقام الآخرين). إذا نُشر ملف Excel في مكان آخر، يستطيع أي شخص التسجيل.

**حل إضافي مقترح:** أضف CAPTCHA بسيط (Cloudflare Turnstile — مجاني):
```tsx
// في register-form.tsx أضف Turnstile script
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async />
<div className="cf-turnstile" data-sitekey="YOUR_SITE_KEY" />
```

### ك-5: إضافة مشرفين متعددين

بعد إنشاء `admin_users` table (قسم د-3)، لإضافة مشرف جديد:
1. اذهب لـ Supabase SQL Editor وشغّل:
   ```sql
   INSERT INTO public.admin_users (email, display_name, added_by)
   VALUES ('new-admin@example.com', 'اسم المشرف', 'admin@bahri.edu.sd');
   ```
2. أو من لوحة التحكم في الموقع بعد بناء صفحة الإدارة.

---

## ترتيب التنفيذ الموصى به

| الخطوة | المهمة | الوقت المقدَّر |
|---|---|---|
| 1 | أ-1 إلى أ-6: إصلاح الأخطاء الحرجة | 1 ساعة |
| 2 | ب: تحسينات الجوال | 1 ساعة |
| 3 | ج-1: حذف سؤال التحقق من التسجيل | 30 دقيقة |
| 4 | ج-2: صفحة "نسيت كلمة السر" | 1 ساعة |
| 5 | د: SQL قاعدة البيانات (شغّل في Supabase) | 15 دقيقة |
| 6 | هـ: إخفاء Leaderboard عن غير المسجَّلين | 30 دقيقة |
| 7 | ط: تحديث Navbar + Logout | 1 ساعة |
| 8 | ح: Accordion للمواد في صفحة الطالب | 30 دقيقة |
| 9 | و: لوحة الإدارة (Admin Module) | 3 ساعات |
| 10 | ز: نموذج تسجيل الضيوف | 1 ساعة |
| 11 | ي: حذف الملفات الزائدة | 5 دقائق |

---

*نهاية الوثيقة — المشروع: BahriMedB13-main*
