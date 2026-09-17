import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { Megaphone, X } from "lucide-react";

import type { Database } from "@/types/database.types";
import { CloseAnnouncement } from "./announcement-close";

/**
 * announcement-banner.tsx — Server Component (Phase 6).
 *
 * Reads the live announcement from `platform_config` (key = 'announcement')
 * and renders dithering-bar. If `enabled` is false or there is no matching
 * localized text the banner renders nothing. The DDL seeds:
 *
 *   value = { "enabled": true, "text_ar": "...", "text_en": "..." }
 *
 * The close state is persisted client-side (localStorage) via a small client
 * button so returning visitors aren't nagged on every navigation.
 */
type AnnouncementConfig = {
  enabled?: boolean;
  text_ar?: string;
  text_en?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function AnnouncementBanner({ locale }: { locale: string }) {
  const t = await getTranslations("Announcement");

  let text: string | null = null;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data } = await supabase
        .from("platform_config")
        .select("value")
        .eq("key", "announcement")
        .single();

      const cfg = (data?.value ?? {}) as AnnouncementConfig;
      if (cfg.enabled !== false) {
        text = (locale === "ar" ? cfg.text_ar ?? cfg.text_en : cfg.text_en ?? cfg.text_ar) ?? null;
      }
    } catch {
      // Never fail the whole app because of a banner fetch issue.
      text = null;
    }
  }

  if (!text) return null;

  return (
    <CloseAnnouncement>
      {(dismissed, onDismiss) =>
        dismissed ? null : (
          <div className="relative z-[60] border-b border-primary/20 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 px-4 py-2">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-center">
              <Megaphone className="size-4 shrink-0 text-primary" aria-hidden />
              <p className="text-sm font-medium text-foreground">{text}</p>
              <button
                type="button"
                onClick={onDismiss}
                aria-label={t("dismiss")}
                className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )
      }
    </CloseAnnouncement>
  );
}