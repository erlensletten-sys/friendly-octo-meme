import { NextResponse } from "next/server";
import { cleanText } from "@/lib/id";
import { deletePreview, getPreview, savePreview } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const preview = await getPreview(id);
  if (!preview) return NextResponse.json({ error: "Fant ikke previewen." }, { status: 404 });
  return NextResponse.json({ preview });
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const preview = await getPreview(id);
  if (!preview) return NextResponse.json({ error: "Fant ikke previewen." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if ("title" in body) preview.title = cleanText(body.title, 120) || preview.title;
  if ("group" in body) preview.group = cleanText(body.group, 80);
  if ("note" in body) preview.note = cleanText(body.note, 500);
  preview.updatedAt = new Date().toISOString();

  await savePreview(preview);
  return NextResponse.json({ preview });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  await deletePreview(id);
  return NextResponse.json({ ok: true });
}
