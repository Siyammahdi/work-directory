import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  if (await isValidSession(req.cookies.get(AUTH_COOKIE)?.value)) return NextResponse.next();
  const login = new URL("/login", req.url);
  const next = req.nextUrl.pathname + req.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Client-facing share pages (/s, /p), the login page and static assets stay public.
  matcher: ["/((?!s/|p/|login|_next/|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
