import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, authEnabled, safeEqual, sessionToken } from "@/lib/auth";

/**
 * Hjemmesiden er offentlig. Bare verktøydelen krever passord.
 *
 * Bevisst utenfor lista, og dermed åpen for alle:
 *  - /s/<token>   kundevisningen, der tokenet er hemmeligheten
 *  - /serve/...   filene previewene består av, som kundevisningen bygger inn
 *  - /api/public  kommentarer fra kunden
 *  - /api/session innlogging
 */
const PROTECTED_PREFIXES = [
  "/visningsrom",
  "/api/previews",
  "/api/shares",
  "/api/comments",
];

export async function proxy(request: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (!PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(ADMIN_COOKIE)?.value ?? "";
  if (cookie && safeEqual(cookie, await sessionToken())) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Ikke innlogget." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?neste=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
