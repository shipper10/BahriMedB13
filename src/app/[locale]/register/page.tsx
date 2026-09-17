import { setRequestLocale, getTranslations } from "next-intl/server";
import { RegisterModeSwitch } from "./register-mode-switch";

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth.register");

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
      <RegisterModeSwitch
        title={t("title")}
        subtitle={t("subtitle")}
        fields={{
          studentId: t("studentId"),
          studentIdPlaceholder: t("studentIdPlaceholder"),
          email: t("email"),
          emailPlaceholder: t("emailPlaceholder"),
          password: t("password"),
          passwordPlaceholder: t("passwordPlaceholder"),
          submit: t("submit"),
          loginLink: t("loginLink"),
          switchToLogin: t("switchToLogin"),
        }}
        errors={{
          STUDENT_NOT_FOUND: t("errors.STUDENT_NOT_FOUND"),
          ALREADY_CLAIMED: t("errors.ALREADY_CLAIMED"),
          REGISTRATION_BLOCKED: t("errors.REGISTRATION_BLOCKED"),
          EMAIL_IN_USE: t("errors.EMAIL_IN_USE"),
          CREATE_FAILED: t("errors.CREATE_FAILED"),
          UPDATE_FAILED: t("errors.UPDATE_FAILED"),
        }}
      />
    </section>
  );
}