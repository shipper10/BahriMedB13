"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { GraduationCap, Loader2, ShieldCheck } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { registerStudent, type RegisterResult } from "./actions";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RegisterError = Extract<RegisterResult, { ok: false }>["error"];

interface RegisterFormProps {
  title: string;
  subtitle: string;
  fields: {
    studentId: string;
    studentIdPlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    submit: string;
    loginLink: string;
    switchToLogin: string;
  };
  errors: Record<RegisterError, string>;
}

export function RegisterForm({
  title,
  subtitle,
  fields,
  errors,
}: RegisterFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Auth.register");

  const [isPending, startTransition] = React.useTransition();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      studentId: String(formData.get("studentId") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    startTransition(async () => {
      const result = await registerStudent(data);
      if (!result.ok) {
        setFormError(errors[result.error]);
        return;
      }
      await signInAndRedirect(result.email, data.password, data.studentId);
    });
  }

  async function signInAndRedirect(email: string, password: string, studentId: string) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setSuccess(t("signedUpPleaseLogin"));
      return;
    }
    setSuccess(t("registered"));
    router.push(`/${locale}/student/${studentId}`);
    router.refresh();
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="size-6" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="studentId">{fields.studentId}</Label>
            <Input
              id="studentId"
              name="studentId"
              inputMode="numeric"
              autoComplete="off"
              placeholder={fields.studentIdPlaceholder}
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">{fields.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={fields.emailPlaceholder}
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">{fields.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              placeholder={fields.passwordPlaceholder}
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          {formError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
              {success}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {fields.submit}
          </Button>

          <p className="text-sm text-muted-foreground">
            {fields.switchToLogin}{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {fields.loginLink}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}