import { NextResponse, type NextRequest } from "next/server";

// Kept in sync with lib/auth/session.ts. Proxy runs before every request, so
// it only does a cheap, optimistic check on the cookie; the real check (a
// database lookup) happens in the data layer on every read and write.
const SESSION_COOKIE = "prepdeck_session";
const SESSION_DAYS = 30;
const AUTH_PAGES = ["/login", "/signup"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!token && !isAuthPage) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  if (token) {
    // Sliding expiry: keep the cookie alive while the user is active.
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });
  }
  return res;
}

export const config = {
  // Everything except API routes (they return 401 themselves) and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico|webp)$).*)"],
};
