"use client";

import * as React from "react";
import { Loader2, Mail } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  title: string;
  subtitle: string;
  emailLabel: string;
  submitLabel: string;
  successMessage: string;
  backToLogin: string;
}

export function ForgotPasswordForm({ title, subtitle, emailLabel, submitLabel, successMessage, backToLogin }: Props) {
  const [email, setEmail] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      setDone(true);
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
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                dir="ltr"
              />
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
