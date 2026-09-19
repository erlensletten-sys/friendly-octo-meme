import { NextResponse } from "next/server";
import { isLocale } from "@/lib/site/content";
import { loadContent } from "@/lib/site/load";
import { klientNokkel } from "@/lib/rateLimit";
import { buildSystemPrompt, overLimit, sanitizeMessages, streamReply, supportEnabled } from "@/lib/support";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Support-chatten. Åpen (ingen innlogging), men bremset per IP og globalt.
 * Tar hele samtalen i hver forespørsel og strømmer svaret som ren tekst.
 */
export async function POST(request: Request) {
  if (!supportEnabled()) return NextResponse.json({ error: "offline" }, { status: 503 });

  if (overLimit(klientNokkel(request))) {
    return NextResponse.json({ error: "too_many" }, { status: 429, headers: { "Retry-After": "600" } });
  }

  const body = (await request.json().catch(() => ({}))) as { locale?: unknown; messages?: unknown };
  const locale = isLocale(body.locale) ? body.locale : "nb";
  const messages = sanitizeMessages(body.messages);
  if (messages.length === 0) return NextResponse.json({ error: "empty" }, { status: 400 });

  const system = buildSystemPrompt(await loadContent(locale));
  try {
    const stream = await streamReply(system, messages);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
    });
  } catch (error) {
    console.error("[support]", error);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
