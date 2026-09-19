import { NextResponse } from "next/server";
import { cleanText, newToken } from "@/lib/id";
import { getPreviews, getShare, listShares, saveShare } from "@/lib/store";
import type { Share } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ shares: await listShares() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const ids = Array.isArray(body.previewIds) ? body.previewIds.map(String) : [];

  const previews = await getPreviews(ids);
  if (previews.length === 0) {
    return NextResponse.json({ error: "Velg minst én preview å dele." }, { status: 400 });
  }

  // En deling får normalt et hemmelig token. Til en offentlig utstilling
  // (arbeid-seksjonen på hjemmesiden) kan admin velge en lesbar slug i
  // stedet - da er lenka ikke hemmelig lenger, og det er meningen.
  let token = newToken();
  if (typeof body.slug === "string" && body.slug !== "") {
    if (!/^[a-z0-9][a-z0-9-]{4,38}[a-z0-9]$/.test(body.slug)) {
      return NextResponse.json(
        { error: "Slug må være 6–40 tegn: små bokstaver, tall og bindestrek." },
        { status: 400 },
      );
    }
    if (await getShare(body.slug)) {
      return NextResponse.json({ error: "Den sluggen er alt i bruk." }, { status: 409 });
    }
    token = body.slug;
  }

  const share: Share = {
    token,
    title: cleanText(body.title, 120) || "Forslag til nettside",
    intro: cleanText(body.intro, 600),
    previewIds: previews.map((preview) => preview.id),
    layout: body.layout === "compare" ? "compare" : "gallery",
    allowComments: body.allowComments !== false,
    createdAt: new Date().toISOString(),
  };

  await saveShare(share);
  return NextResponse.json({ share }, { status: 201 });
}
