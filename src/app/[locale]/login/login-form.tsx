"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { KeyRound, Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  title: string;
  subtitle: string;
  fields: {
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    submit: string;
    noAccount: string;
    registerLink: string;
  };
  errors: {
    INVALID_CREDENTIALS: string;
    NETWORK_ERROR: string;
  };
}

export function LoginForm({ title, subtitle, fields, errors }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Auth.login");

  const [isPending, startTransition] = React.useTransition();
  const [formError, setFormError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setFormError(error.message ? errors.NETWORK_ERROR : errors.INVALID_CREDENTIALS);
        return;
      }
      // Return the student to the protected page they were heading to, or home.
      const next = searchParams.get("next");
      router.push(next || "/");
      router.refresh();
    });
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="size-6" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
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
              autoComplete="current-password"
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

          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {fields.submit}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("forgotPassword")}
            </Link>
          </p>

          <p className="text-sm text-muted-foreground">
            {fields.noAccount}{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {fields.registerLink}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}