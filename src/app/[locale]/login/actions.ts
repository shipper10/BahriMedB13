"use server";

import { createUserSupabaseClient } from "@/lib/supabase/server-auth";

/**
 * login/actions.ts — Server action used by the login flow.
 *
 * Delegates credential verification to the browser Supabase client
 * (signInWithPassword) because the session cookies must be written in the
 * browser context. This helper validates the inbound credentials against the
 * Supabase Auth endpoint and returns a lightweight result the form maps into
 * localized messages; it avoids exposing raw auth internals to the client.
 */

export type LoginResult =
  | { ok: true; email: string }
  | { ok: false; error: "INVALID_CREDENTIALS" | "NETWORK_ERROR" };

export async function login(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  // The `createUserSupabaseClient` is cookie-bound; performing sign-in here
  // is safe because the middleware will persist the refreshed session cookies
  // on the ensuing request. We use it to avoid importing the browser client
  // into a server action (server-only).
  const supabase = await createUserSupabaseClient();
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (error) {
      return { ok: false, error: "INVALID_CREDENTIALS" };
    }
    return { ok: true, email };
  } catch {
    return { ok: false, error: "NETWORK_ERROR" };
  }
}