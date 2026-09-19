import { NextResponse } from "next/server";
import { ADMIN_COOKIE, authEnabled, safeEqual, sessionToken } from "@/lib/auth";
import { klientNokkel, nullstill, registrerFeil, vent, vurderForsok } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Logg inn. Passordet sammenlignes i konstant tid, og cookien er en hash.
 * Feilforsøk svarer tregere og tregere, og etter noen av dem er IP-en sperret
 * en periode - se `src/lib/rateLimit.ts`.
 */
export async function POST(request: Request) {
  if (!authEnabled()) return NextResponse.json({ ok: true });

  const nokkel = klientNokkel(request);
  const vurdering = vurderForsok(nokkel);
  if (!vurdering.tillatt) {
    return NextResponse.json(
      { error: "For mange forsøk. Prøv igjen senere." },
      { status: 429, headers: { "Retry-After": String(vurdering.sperretISekunder) } },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const given = typeof body.password === "string" ? body.password : "";

  // Begge sider hashes først, slik at sammenligningen alltid er like lang.
  const [givenHash, expectedHash] = await Promise.all([
    sessionToken(given),
    sessionToken(),
  ]);
  if (!safeEqual(givenHash, expectedHash)) {
    registrerFeil(nokkel);
    await vent(vurdering.ventMs);
    return NextResponse.json({ error: "Feil passord." }, { status: 401 });
  }

  nullstill(nokkel);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

/** Logg ut. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
