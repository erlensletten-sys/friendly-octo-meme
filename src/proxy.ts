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

/**
 * Programmer som finnes for å speile hele nettsteder, og roboter som samler
 * tekst til trening av språkmodeller. De får 403 overalt unntatt robots.txt.
 * Søkemotorer (Googlebot, Bingbot) og lenkeforhåndsvisninger slipper gjennom.
 *
 * Dette stopper de ærlige: user-agent kan forfalskes. Det er en sperre mot
 * masseinnsamling, ikke mot en person som vil kopiere én side for hånd.
 */
const BLOCKED_AGENTS =
  /httrack|webcopier|webzip|offline explorer|sitesucker|sitesnagger|teleport ?pro|webstripper|webreaper|website ?extractor|web ?downloader|wget|scrapy|python-requests|python-urllib|aiohttp|go-http-client|node-fetch|axios\/|gptbot|ccbot|claudebot|claude-web|anthropic-ai|bytespider|meta-externalagent|diffbot|imagesiftbot|cohere-ai|omgili|timpibot|img2dataset|petalbot/i;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== "/robots.txt" && BLOCKED_AGENTS.test(request.headers.get("user-agent") ?? "")) {
    return new NextResponse("Forbidden", { status: 403 });
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
