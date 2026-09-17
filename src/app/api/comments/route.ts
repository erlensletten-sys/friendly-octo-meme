import { NextResponse } from "next/server";
import { deleteComment, listCommentsFor } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("previewIds") ?? "";
  const previewIds = ids.split(",").map((id) => id.trim()).filter(Boolean);
  if (previewIds.length === 0) return NextResponse.json({ comments: {} });
  return NextResponse.json({ comments: await listCommentsFor(previewIds) });
}

export async function DELETE(request: Request) {
  const params = new URL(request.url).searchParams;
  const previewId = params.get("previewId") ?? "";
  const commentId = params.get("commentId") ?? "";
  if (!previewId || !commentId) {
    return NextResponse.json({ error: "Mangler previewId eller commentId." }, { status: 400 });
  }
  await deleteComment(previewId, commentId);
  return NextResponse.json({ ok: true });
}
