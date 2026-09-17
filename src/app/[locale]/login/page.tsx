import { setRequestLocale, getTranslations } from "next-intl/server";
import React from "react";
import { LoginForm } from "./login-form";

type Props = { params: Promise<{ locale: string }> };

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth.login");

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <React.Suspense fallback={<div />}>
        <LoginForm
          title={t("title")}
          subtitle={t("subtitle")}
          fields={{
            email: t("email"),
            emailPlaceholder: t("emailPlaceholder"),
            password: t("password"),
            passwordPlaceholder: t("passwordPlaceholder"),
            submit: t("submit"),
            noAccount: t("noAccount"),
            registerLink: t("registerLink"),
          }}
          errors={{
            INVALID_CREDENTIALS: t("errors.INVALID_CREDENTIALS"),
            NETWORK_ERROR: t("errors.NETWORK_ERROR"),
          }}
        />
      </React.Suspense>
    </section>
  );
}