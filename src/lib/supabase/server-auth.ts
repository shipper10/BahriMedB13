/**
 * supabase/server-auth.ts — User-session Supabase client for Server
 * Components and Server Actions (Phase 5).
 *
 * Unlike `./server.ts` (the SERVICE_ROLE admin client), this client is bound
 * to the authenticated end-user via their session cookies and the anon key,
 * so PostgreSQL Row-Level-Security policies apply. It is used on the
 * protected `/student/[id]` route to guarantee a student can only read their
 * own record.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database.types";

/**
 * Create a Supabase client scoped to the current request's session cookies.
 *
 * In Server Components `cookies().set()` is not allowed, so writes are
 * swallowed; the middleware (`createMiddlewareSupabaseClient`) is
 * responsible for persisting refreshed tokens back to the browser.
 */
export async function createUserSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — ignore, middleware refreshes.
          }
        },
      },
    },
  );
}