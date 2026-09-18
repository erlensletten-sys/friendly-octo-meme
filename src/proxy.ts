import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, authEnabled, safeEqual, sessionToken } from "@/lib/auth";
import { LANG_COOKIE } from "@/lib/site/content";

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
  const { pathname } = request.nextUrl;

  // Den som har valgt engelsk, og kommer til rota, skal rett til /en. Bare
  // rota: en delt lenke til /en åpnes alltid på engelsk, og en som eksplisitt
  // går til / etter å ha valgt norsk igjen, får norsk (bryteren i menyen
  // skriver cookien om før den navigerer).
  if (pathname === "/" && request.cookies.get(LANG_COOKIE)?.value === "en") {
    const url = request.nextUrl.clone();
    url.pathname = "/en";
    return NextResponse.redirect(url, 307);
  }

  if (!authEnabled()) return NextResponse.next();

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
