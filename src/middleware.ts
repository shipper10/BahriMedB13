import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { createMiddlewareSupabaseClient } from "./lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

/**
 * Combines next-intl locale routing with Phase 5 auth route protection:
 *  - `/student/...` is only reachable by an authenticated visitor.
 *  - Authenticated visitors hitting `/login` or `/register` are sent home.
 * The Supabase SSR client refreshes the session and sets the updated auth
 * cookies onto `supabaseResponse`, which we merge onto the final response.
 */
export async function middleware(request: NextRequest) {
  // 1) Initialize the session-bound SSR client, refresh tokens + get user.
  const { supabaseResponse, user } =
    await createMiddlewareSupabaseClient(request);

  // 2) Resolve the current locale and the locale-stripped path.
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const locale = routing.locales.includes(segments[0] as never)
    ? segments[0]
    : routing.defaultLocale;
  const base = `/${locale}`;
  const cleanPath = pathname.startsWith(base)
    ? pathname.slice(base.length) || "/"
    : pathname;

  // 3) Route protection decisions.
  const isProtected = cleanPath.startsWith("/student");
  const isAuthRoute = cleanPath === "/login" || cleanPath === "/register";

  if (isProtected && !user) {
    const to = `/${locale}/login?next=${encodeURIComponent(pathname)}`;
    return withCookies(request, to, supabaseResponse);
  }

  if (isAuthRoute && user) {
    return withCookies(request, `/${locale}`, supabaseResponse);
  }

  // 4) Delegate locale negotiation to next-intl and carry auth cookies over.
  const intlResponse = handleI18nRouting(request);
  copyCookies(supabaseResponse, intlResponse);
  return intlResponse;
}

/** Redirect to `toPath` while carrying the refreshed auth cookies along. */
function withCookies(
  request: NextRequest,
  toPath: string,
  source: NextResponse,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = toPath;
  const res = NextResponse.redirect(url);
  copyCookies(source, res);
  return res;
}

/** Copy every set-cookie from the Supabase SSR response onto the target. */
function copyCookies(source: NextResponse, target: NextResponse): void {
  source.cookies.getAll().forEach(({ name, value, ...rest }) => {
    target.cookies.set(name, value, {
      path: rest.path,
      domain: rest.domain,
      sameSite: rest.sameSite,
      secure: rest.secure,
      httpOnly: rest.httpOnly,
      maxAge: rest.maxAge,
      expires: rest.expires,
    });
  });
}

export const config = {
  // Run on all paths except API/trpc routes, Next internals, and static files.
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};