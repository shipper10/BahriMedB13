import { setRequestLocale, getTranslations } from "next-intl/server";
import { BookOpen, BarChart3, Target, ArrowLeftRight } from "lucide-react";

import { createUserSupabaseClient } from "@/lib/supabase/server-auth";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaderboardSection } from "@/components/leaderboard/leaderboard-section";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createUserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">منصة تحليلات الدفعة 13</h1>
          <p className="text-lg text-muted-foreground">كلية الطب والجراحة — جامعة بحري</p>
          <p className="text-muted-foreground">سجّل دخولك للوصول إلى لوحة الترتيب وملفك الأكاديمي</p>
        </div>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/register">إنشاء حساب</Link>
          </Button>
        </div>
      </section>
    );
  }

  const t = await getTranslations("Home.hero");
  const tf = await getTranslations("Home.features");

  const features = [
    { id: "leaderboard", icon: <BarChart3 className="size-8" /> },
    { id: "simulator", icon: <Target className="size-8" /> },
    { id: "analysis", icon: <BookOpen className="size-8" /> },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <ArrowLeftRight className="size-4" />
          Faculty of Medicine &amp; Surgery — University of Bahri
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("welcome")}
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.id}
            id={feature.id === "leaderboard" ? "leaderboard" : feature.id}
            className="group relative overflow-hidden transition-shadow hover:shadow-lg"
          >
            <CardHeader>
              <div className="mb-3 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {feature.icon}
              </div>
              <CardTitle className="text-xl">{tf(`${feature.id}.title`)}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {tf(`${feature.id}.desc`)}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div id="leaderboard" className="mt-16 scroll-mt-24">
        <LeaderboardSection params={params} />
      </div>
    </section>
  );
}