"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const code = searchParams.get("code");
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (!error) {
      setDone(true);
      setTimeout(() => router.push("/login"), 1200);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-6" />
          </div>
          <CardTitle className="text-2xl">إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription>اختر كلمة مرور جديدة لحسابك.</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-600 dark:text-emerald-400">
              تم تحديث كلمة المرور بنجاح.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  dir="ltr"
                />
              </div>
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                حفظ كلمة المرور
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
