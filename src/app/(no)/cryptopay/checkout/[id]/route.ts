import { NextResponse } from "next/server";

/**
 * Produktet serverer en egen betalingsside på /checkout/<id> (med QR).
 * I demoen sendes den videre til den statiske checkout-sida, som poller
 * samme status-API.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(request.url);
  url.pathname = "/cryptopay/checkout.html";
  url.search = `?id=${encodeURIComponent(id)}&api=/cryptopay`;
  return NextResponse.redirect(url, 302);
}
