export { default } from "next-auth/middleware";

export const config = {
  // Run on everything except: NextAuth API routes, /login, Next internals,
  // and the favicon. Anything else requires a session — redirects to /login.
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
