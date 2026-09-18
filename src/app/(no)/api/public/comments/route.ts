import { NextResponse } from "next/server";
import { cleanText } from "@/lib/id";
import { addComment, getShare } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Kommentarer fra kundevisningen. Ruta ligger under /api/public/ og er derfor
 * unntatt passordet, men skriver bare inn i previews som faktisk er delt
 * gjennom den oppgitte tokenen.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const token = cleanText(body.token, 64);
  const previewId = cleanText(body.previewId, 32);
  const text = cleanText(body.body, 2000);
  const author = cleanText(body.author, 80) || "Kunde";

  if (!text) {
    return NextResponse.json({ error: "Skriv en kommentar først." }, { status: 400 });
  }

  const share = await getShare(token);
  if (!share || !share.allowComments || !share.previewIds.includes(previewId)) {
    return NextResponse.json({ error: "Kommentarer er ikke åpne her." }, { status: 403 });
  }

  const comment = await addComment({ previewId, shareToken: token, author, body: text });
  return NextResponse.json({ comment }, { status: 201 });
}
