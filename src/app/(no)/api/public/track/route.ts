import { NextResponse } from "next/server";
import { ADMIN_COOKIE, authEnabled, safeEqual, sessionToken } from "@/lib/auth";
import { cleanText } from "@/lib/id";
import { klientNokkel } from "@/lib/rateLimit";
import {
  allowedHosts,
  MAX_CLICKS,
  SECTIONS,
  UNTRACKED_PREFIXES,
  type ClickRecord,
} from "@/lib/analytics/shared";
import {
  browserFrom,
  deviceFrom,
  isBot,
  osloDay,
  recordClone,
  saveVisit,
  visitorHash,
  type Visit,
} from "@/lib/analytics/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY = 16 * 1024;
const ID_PATTERN = /^([0-9a-z]{6,12})-([0-9a-z]{6,16})$/;

/**
 * Tar imot målinger fra hjemmesiden og kundevisningen. Ligger under
 * /api/public/ og er åpen, så alt som kommer inn behandles som fiendtlig:
 * størrelsen er begrenset, feltene vaskes, og hver IP har en kvote.
 *
 * Svarer alltid 204 - også når noe forkastes - så ruta ikke forteller noen
 * hva som slapp gjennom.
 */
export async function POST(request: Request) {
  const done = new NextResponse(null, { status: 204, headers: CORS });
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return done;

  // Eierens egne besøk telles ikke. Cookien følger med fordi beaconen går
  // til samme origin.
  if (authEnabled()) {
    const cookie = request.headers
      .get("cookie")
      ?.split(/;\s*/)
      .find((part) => part.startsWith(`${ADMIN_COOKIE}=`))
      ?.slice(ADMIN_COOKIE.length + 1);
    if (cookie && safeEqual(decodeURIComponent(cookie), await sessionToken())) return done;
  }

  const ip = klientNokkel(request);
  if (!withinQuota(ip)) return done;

  const text = await request.text().catch(() => "");
  if (!text || text.length > MAX_BODY) return done;
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return done;
  }

  try {
    if (body.kind === "clone") await handleClone(body, request);
    else if (body.kind === "pageview") await handlePageview(body, request, ip, userAgent);
  } catch (error) {
    // Måling skal aldri gi en feil i nettleseren til den besøkende.
    console.error("[track]", error);
  }
  return done;
}

/** Kopier av sida sender fra et annet domene. text/plain krever ingen preflight, men svaret må tillates. */
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function handleClone(body: Record<string, unknown>, request: Request) {
  const host = cleanText(body.host, 120).toLowerCase();
  if (!host || !/^[a-z0-9.[\]:-]+$/.test(host)) return;
  // Den som melder er nettleseren på kopien. Stemmer Origin-headeren med
  // vertsnavnet, er det en ekte kopi og ikke noen som fyller opp lista.
  const origin = request.headers.get("origin");
  if (origin && origin !== "null") {
    try {
      if (new URL(origin).hostname.toLowerCase() !== host) return;
    } catch {
      return;
    }
  }
  if (allowedHosts().includes(host)) return;
  await recordClone(host, cleanText(body.href, 300), cleanText(body.referrer, 300));
}

async function handlePageview(body: Record<string, unknown>, request: Request, ip: string, userAgent: string) {
  const id = cleanText(body.id, 40);
  const match = ID_PATTERN.exec(id);
  if (!match) return;
  const started = parseInt(match[1], 36);
  const now = Date.now();
  if (!Number.isFinite(started) || started > now + 5 * 60_000 || started < now - 36 * 60 * 60_000) return;

  const path = cleanPath(body.path);
  if (!path || UNTRACKED_PREFIXES.some((prefix) => path.startsWith(prefix))) return;

  const ownHost = new URL(request.url).host;
  const day = osloDay(started);

  const visit: Visit = {
    id,
    path,
    startedAt: new Date(started).toISOString(),
    updatedAt: new Date(now).toISOString(),
    visitor: visitorHash(ip, userAgent, day),
    country: cleanText(request.headers.get("x-vercel-ip-country"), 4).toUpperCase() || "??",
    device: deviceFrom(userAgent),
    browser: browserFrom(userAgent),
    referrer: referrerHost(body.referrer, ownHost),
    utmSource: cleanText(body.utmSource, 60) || undefined,
    utmMedium: cleanText(body.utmMedium, 60) || undefined,
    utmCampaign: cleanText(body.utmCampaign, 80) || undefined,
    screenW: clampInt(body.screenW, 0, 10_000),
    lang: cleanText(body.lang, 16),
    // Mer enn et døgn aktiv på én visning er ikke et menneske.
    activeMs: clampInt(body.activeMs, 0, 24 * 60 * 60_000),
    scroll: clampInt(body.scroll, 0, 100),
    sections: Array.isArray(body.sections)
      ? body.sections.filter((s): s is (typeof SECTIONS)[number] => SECTIONS.includes(s as never))
      : [],
    clicks: Array.isArray(body.clicks) ? body.clicks.slice(0, MAX_CLICKS).map(cleanClick).filter(isClick) : [],
  };

  await saveVisit(visit);
}

function cleanPath(value: unknown): string {
  const raw = cleanText(value, 300);
  if (!raw.startsWith("/")) return "";
  return raw.split(/[?#]/)[0].slice(0, 200) || "/";
}

function referrerHost(value: unknown, ownHost: string): string {
  const raw = cleanText(value, 500);
  if (!raw) return "(direkte)";
  try {
    const host = new URL(raw).host.replace(/^www\./, "");
    if (!host || host === ownHost.replace(/^www\./, "")) return "(intern)";
    return host;
  } catch {
    return "(ukjent)";
  }
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = typeof value === "number" ? Math.round(value) : 0;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0;
}

function cleanClick(value: unknown): ClickRecord | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const label = cleanText(item.label, 80);
  if (!label) return null;
  const href = cleanText(item.href, 300);
  const section = cleanText(item.section, 40);
  return {
    label,
    href: href || undefined,
    section: SECTIONS.includes(section as never) ? section : undefined,
    at: clampInt(item.at, 0, 24 * 60 * 60_000),
  };
}

const isClick = (value: ClickRecord | null): value is ClickRecord => value !== null;

/* ---------------------------------------------------------------- kvote */

// Samme forbehold som innloggingssperra: tellerne lever i minnet til
// instansen. Det holder til å stoppe én klient som fyller lageret.
const KVOTE = 120;
const KVOTE_VINDU_MS = 10 * 60_000;
const kvoter = new Map<string, { antall: number; start: number }>();

function withinQuota(ip: string, now = Date.now()): boolean {
  if (kvoter.size > 5000) kvoter.clear();
  const entry = kvoter.get(ip);
  if (!entry || now - entry.start > KVOTE_VINDU_MS) {
    kvoter.set(ip, { antall: 1, start: now });
    return true;
  }
  entry.antall += 1;
  return entry.antall <= KVOTE;
}
