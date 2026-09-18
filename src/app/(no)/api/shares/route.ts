import { NextResponse } from "next/server";
import { cleanText, newToken } from "@/lib/id";
import { getPreviews, listShares, saveShare } from "@/lib/store";
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

  const share: Share = {
    token: newToken(),
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
