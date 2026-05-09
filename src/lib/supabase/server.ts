import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Server-side Supabase client. Reads the auth cookie from Next's cookie store
// and writes back any session-refresh cookies that supabase-ssr emits.
//
// In a Server Component, cookies are read-only — the setAll() call may throw,
// which we swallow. Middleware is responsible for actually persisting refreshed
// tokens to the response. Route handlers and server actions DO have writable
// cookies, so writes succeed there.
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // Server Component context — Next.js disallows cookie writes here.
            // The middleware client handles refresh token persistence.
          }
        },
      },
    },
  );
}
