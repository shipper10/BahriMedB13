"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RegisterForm } from "./register-form";
import { GuestRegistrationForm } from "./guest-form";

interface RegisterModeSwitchProps {
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
  errors: Record<string, string>;
}

export function RegisterModeSwitch({
  title,
  subtitle,
  fields,
  errors,
}: RegisterModeSwitchProps) {
  const t = useTranslations("Auth.register");
  const [mode, setMode] = React.useState<"student" | "guest">("student");

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
        <Button
          type="button"
          variant={mode === "student" ? "default" : "ghost"}
          className={cn("rounded-lg", mode !== "student" && "text-muted-foreground")}
          onClick={() => setMode("student")}
        >
          {t("studentTab")}
        </Button>
        <Button
          type="button"
          variant={mode === "guest" ? "default" : "ghost"}
          className={cn("rounded-lg", mode !== "guest" && "text-muted-foreground")}
          onClick={() => setMode("guest")}
        >
          {t("guestTab")}
        </Button>
      </div>

      {mode === "student" ? (
        <RegisterForm title={title} subtitle={subtitle} fields={fields} errors={errors as any} />
      ) : (
        <GuestRegistrationForm />
      )}
    </div>
  );
}
