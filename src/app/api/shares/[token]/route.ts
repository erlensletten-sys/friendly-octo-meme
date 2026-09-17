import { NextResponse } from "next/server";
import { deleteShare, getShare } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ token: string }> };

export async function DELETE(_request: Request, context: Context) {
  const { token } = await context.params;
  const share = await getShare(token);
  if (!share) return NextResponse.json({ error: "Fant ikke delingen." }, { status: 404 });
  await deleteShare(token);
  return NextResponse.json({ ok: true });
}
