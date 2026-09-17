/**
 * supabase/client.ts — Browser (client-component) Supabase client.
 *
 * Uses `@supabase/ssr`'s `createBrowserClient` so that auth sessions are
 * persisted in cookies rather than localStorage. This keeps the session
 * readable by the RSC/middleware clients (and RLS guarded queries) across
 * requests. The anon key is safe to expose in the browser bundle.
 */
import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/** Convenience singleton for client components. */
export const supabase = createClient();