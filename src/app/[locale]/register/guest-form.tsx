"use client";

import * as React from "react";
import { Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

export function GuestRegistrationForm() {
  const t = useTranslations("Auth.register.guest");
  const [isPending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const { error } = await supabase.from("guest_registration_requests").insert({
        full_name_ar: String(formData.get("name_ar") ?? ""),
        full_name_en: String(formData.get("name_en") ?? ""),
        email: String(formData.get("email") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      });

      if (!error) {
        setDone(true);
        form.reset();
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6 text-center text-sm text-emerald-700 dark:text-emerald-300">
        {t("success")}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="size-6" />
        </div>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="guest-name-ar">{t("nameAr")}</Label>
            <Input id="guest-name-ar" name="name_ar" required placeholder={t("nameArPlaceholder")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="guest-name-en">{t("nameEn")}</Label>
            <Input id="guest-name-en" name="name_en" required placeholder={t("nameEnPlaceholder")} dir="ltr" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="guest-email">{t("email")}</Label>
            <Input id="guest-email" name="email" type="email" required dir="ltr" placeholder={t("emailPlaceholder")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="guest-reason">{t("reason")}</Label>
            <Input id="guest-reason" name="reason" placeholder={t("reasonPlaceholder")} />
          </div>

          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
