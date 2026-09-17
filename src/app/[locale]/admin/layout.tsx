import { redirect } from "next/navigation";

import { createUserSupabaseClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getUserLocale } from "@/i18n/server-locale";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getUserLocale();
  const supabase = await createUserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: admin } = await supabaseAdmin
    .from("admin_users")
    .select("email")
    .eq("email", user.email ?? "")
    .maybeSingle();

  if (!admin) redirect(`/${locale}`);

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
