import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Refresh the Supabase session on every request, gate access on two rules:
//   1. Must be signed in (else → /login).
//   2. Email must end with @4brains.in (else → /login?reason=domain).
// The cookie-set dance is the canonical Supabase SSR middleware: reads
// request cookies, lets supabase rotate them, mirrors changes onto both
// the request (so downstream handlers see the new cookie) and the
// outgoing response.

const ALLOWED_DOMAIN = "@4brains.in";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as CookieOptions),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Domain gate — only @4brains.in employees inside.
  // If a Supabase signup somehow created a non-@4brains.in account, sign
  // them out here and bounce to /login with an explanatory query param.
  const email = (user.email || "").toLowerCase();
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("reason", "domain");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip /login, /signup, /auth (Supabase email-confirm callbacks), Next.js
  // internals, and the favicon — everything else requires a session.
  matcher: [
    "/((?!login|signup|auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
