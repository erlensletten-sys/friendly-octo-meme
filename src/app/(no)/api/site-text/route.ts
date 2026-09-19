import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getContent, isLocale } from "@/lib/site/content";
import { flattenContent, sanitizeOverrides } from "@/lib/site/overrides";
import { getSiteText, saveSiteText } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Teksten på hjemmesiden, til redigeringssida i Visningsrom. Bak passord
 * (proxy.ts). GET gir standardtekst + overstyringer for ett språk; PUT lagrer
 * overstyringene og bygger forsida på nytt.
 */
export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get("locale");
  if (!isLocale(locale)) return NextResponse.json({ error: "locale må være nb eller en." }, { status: 400 });
  const [fields, overrides] = [flattenContent(getContent(locale)), await getSiteText(locale)];
  return NextResponse.json({ locale, fields, overrides });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { locale?: unknown; overrides?: unknown };
  if (!isLocale(body.locale)) return NextResponse.json({ error: "locale må være nb eller en." }, { status: 400 });
  const overrides = sanitizeOverrides(body.overrides, getContent(body.locale));
  await saveSiteText(body.locale, overrides);
  revalidatePath(body.locale === "en" ? "/en" : "/");
  return NextResponse.json({ ok: true, count: Object.keys(overrides).length, overrides });
}
