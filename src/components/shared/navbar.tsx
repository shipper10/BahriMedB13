"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { GraduationCap, Languages, Moon, Monitor, Sun } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/shared/logout-button";

interface NavbarProps {
  userEmail: string | null;
  studentId: string | null;
}

export function Navbar({ userEmail, studentId }: NavbarProps) {
  const t = useTranslations("Navbar");
  const tl = useTranslations("LanguageSwitcher");
  const tt = useTranslations("ThemeToggle");
  const locale = useLocale();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch for theme icon
  React.useEffect(() => setMounted(true), []);

  const navItems = [
    { href: "#leaderboard", label: t("nav.leaderboard") },
    { href: "#simulator", label: t("nav.simulator") },
    { href: "#analysis", label: t("nav.analysis") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-foreground"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base">{t("brand")}</span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {t("brandSub")}
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav
          className={cn(
            "hidden items-center gap-1 md:flex",
            locale === "ar" ? "md:mr-auto md:ml-6" : "md:ml-auto md:mr-6"
          )}
        >
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 sm:flex">
            {userEmail ? (
              <>
                {studentId && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/student/${studentId}`}>{t("nav.myProfile")}</Link>
                  </Button>
                )}
                <LogoutButton />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link href="/register">{t("nav.register")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={tl("label")}>
                <Languages className="size-5" />
                <span className="sr-only">{tl("label")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{tl("label")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={pathname} locale="ar" className="cursor-pointer">
                  العربية
                  {locale === "ar" ? (
                    <span className="ms-auto text-primary">✓</span>
                  ) : null}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={pathname} locale="en" className="cursor-pointer">
                  English
                  {locale === "en" ? (
                    <span className="ms-auto text-primary">✓</span>
                  ) : null}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={tt("system")}>
                {mounted && theme === "dark" ? (
                  <Moon className="size-5" />
                ) : (
                  <Sun className="size-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{tt("label")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="size-4" />
                {tt("light")}
                {mounted && theme === "light" && (
                  <span className="ms-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="size-4" />
                {tt("dark")}
                {mounted && theme === "dark" && (
                  <span className="ms-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="size-4" />
                {tt("system")}
                {mounted && theme === "system" && (
                  <span className="ms-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}