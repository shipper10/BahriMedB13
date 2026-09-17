/**
 * leaderboard/leaderboard-section.tsx
 * Server Component — fetches the leaderboard data from Supabase
 * server-side via `vw_public_leaderboard`, transforms the per-semester
 * rows into one row per student, and hands the result to the client
 * <LeaderboardDataTable /> for interactive sorting / filtering.
 *
 * Security notes:
 *  - The view is publicly readable (`GRANT SELECT ... TO anon`), so the
 *    server uses the anon key for this read. IDs are already masked.
 *  - No privileged data is ever exposed.
 */
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createClient } from "@supabase/supabase-js";
import {
  transformLeaderboardRows,
  type LeaderboardViewRow,
} from "./leaderboard-transform";
import { LeaderboardDataTable } from "./data-table";

type Props = { params: Promise<{ locale: string }> };

/** Server component — queries Supabase on the edge/server. */
export async function LeaderboardSection({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Leaderboard");

  // Build the Supabase server client with the anon key (safe for public reads).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch all public leaderboard rows; the view handles identity masking.
  const { data, error } = await supabase
    .from("vw_public_leaderboard")
    .select("*")
    .order("cumulative_gpa", { ascending: false });

  const rows: LeaderboardViewRow[] = error ? [] : (data ?? []);

  const leaderboard = transformLeaderboardRows(rows);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
      {/* Section heading */}
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          {t("title")}
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Interactive table (client component) */}
      <LeaderboardDataTable data={leaderboard} />
    </section>
  );
}