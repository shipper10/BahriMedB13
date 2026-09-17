/**
 * supabase/middleware.ts — Cookie-aware Supabase client factory for the
 * Next.js middleware layer (Phase 5 route protection).
 *
 * Uses `@supabase/ssr`'s `createServerClient`. The client reads cookies from
 * the incoming request and, on token refresh, writes the updated session
 * cookies back onto the `supabaseResponse` object. Callers must return (or
 * merge onto) `supabaseResponse` so refreshed cookies reach the browser.
 */
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/types/database.types";

/**
 * Initialize a Supabase SSR client bound to the current request, refreshing
 * the session if the access token is close to (or past) expiry.
 *
 * Returns the freshly-created `supabaseResponse` (carrying any refreshed or
 * cleared auth cookies) and the authenticated `user`.
 */
export async function createMiddlewareSupabaseClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: call getUser() early so token refresh writes the fresh
  // session into supabaseResponse before any response is produced.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, supabaseResponse, user };
}