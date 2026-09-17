import { getLocale } from "next-intl/server";

/** Resolve the active locale on the server (used for redirects in server components). */
export async function getUserLocale(): Promise<string> {
  return getLocale();
}