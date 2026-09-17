/**
 * supabase/server.ts — Server-side Supabase client for privileged operations.
 * Uses the SERVICE_ROLE key (KEEP SECRET, server-only) to bypass RLS during
 * the Excel ingestion pipeline. Never imported from client components.
 */
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceRole) {
    throw new Error(
      'Missing Supabase server credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).',
    );
  }
  return createClient<Database>(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Convenience singleton for API routes / ingestion scripts. */
export const supabaseAdmin = createServerClient();