"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t border-border bg-background/80 py-6 text-center text-sm text-muted-foreground backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {t("rights")}
      </div>
    </footer>
  );
}