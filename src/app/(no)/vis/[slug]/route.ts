import { NextResponse } from "next/server";
import { getPreviews, getShare } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Stabil adresse til sida selv i en deling: /vis/<slug> sender videre til
 * /serve/<id>/ for den første pakken i delingen (eller ?n=<index>). Da kan
 * hjemmesiden peke på «utstillingen» uten å kjenne preview-id-en, som først
 * finnes etter opplasting - og en ny opplasting under samme slug bytter
 * innholdet uten en eneste kodeendring.
 */
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const share = await getShare(slug);
  if (!share) return new NextResponse("Fant ingen utstilling med det navnet.", { status: 404 });

  const previews = (await getPreviews(share.previewIds)).filter(
    (p) => p.kind === "bundle" && p.entry,
  );
  const n = Math.max(0, Number(new URL(request.url).searchParams.get("n")) || 0);
  const preview = previews[n];
  if (!preview) return new NextResponse("Utstillingen har ingen pakke å vise.", { status: 404 });

  return NextResponse.redirect(new URL(`/serve/${preview.id}/${preview.entry}`, request.url), 307);
}
