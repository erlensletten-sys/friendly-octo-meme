import { NextResponse } from "next/server";
import { ApiError, demo, priceQuote, publicEscrowView, publicInvoiceView, requireAuth, serializeInvoice } from "@/lib/cryptopayDemo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stand-in for CryptoPay-API-et under /cryptopay/v1. Samme stier og svar som
 * det ekte API-et; logikken bak ligger i src/lib/cryptopayDemo.ts.
 */

type Ctx = { params: Promise<{ path: string[] }> };

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const fail = (e: unknown) => {
  if (e instanceof ApiError) return json({ error: { code: e.code, message: e.message } }, e.status);
  console.error("[cryptopay-demo]", e);
  return json({ error: { code: "internal", message: "demo hiccup" } }, 500);
};

async function body(request: Request): Promise<Record<string, unknown>> {
  const parsed = await request.json().catch(() => null);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
}

export async function GET(request: Request, ctx: Ctx) {
  const path = (await ctx.params).path;
  const url = new URL(request.url);
  try {
    if (path.length === 1 && path[0] === "health") return json({ status: "ok", time: Date.now(), demo: true });

    if (path[0] === "prices" && path.length === 2) {
      if (path[1].toUpperCase() !== "BTC") throw new ApiError(400, "unsupported_asset", "asset must be BTC");
      return json(priceQuote());
    }

    if (path[0] === "oracle" && path[1] === "pubkey") {
      return json({ algorithm: "ed25519", publicKey: priceQuote().publicKey });
    }

    if (path[0] === "checkout" && path.length === 2) {
      const inv = demo.getInvoice(path[1]);
      if (!inv) throw new ApiError(404, "not_found", "invoice not found");
      return json(publicInvoiceView(inv));
    }

    if (path[0] === "account" && path.length === 1) {
      requireAuth(request);
      return json(demo.account());
    }

    if (path[0] === "invoices") {
      requireAuth(request);
      if (path.length === 1) {
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
        return json({ invoices: demo.listInvoices(limit) });
      }
      const inv = demo.getInvoice(path[1]);
      if (!inv) throw new ApiError(404, "not_found", "invoice not found");
      return json(serializeInvoice(inv));
    }

    if (path[0] === "escrows") {
      if (path.length === 1) {
        requireAuth(request);
        return json({ escrows: demo.listEscrows() });
      }
      if (path.length === 2) {
        const e = demo.getEscrow(path[1]);
        if (!e) throw new ApiError(404, "not_found", "escrow not found");
        return json(publicEscrowView(e));
      }
      requireAuth(request);
      if (path[2] === "release-tx") return json(demo.releaseTx(path[1]));
      if (path[2] === "refund-tx") return json(demo.refundTx(path[1], url.searchParams.get("mode") ?? "cooperative"));
    }

    throw new ApiError(404, "not_found", "no such route");
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const path = (await ctx.params).path;
  try {
    if (path[0] === "pgp" && path[1] === "challenge") {
      const b = await body(request);
      return json(await demo.pgpChallenge(b.publicKey));
    }
    if (path[0] === "pgp" && path[1] === "verify") {
      const b = await body(request);
      const r = demo.pgpVerify(b.challengeId, b.decrypted);
      return r.ok ? json({ verified: true, fingerprint: r.fingerprint }) : json({ verified: false, reason: r.reason }, 400);
    }

    requireAuth(request);

    if (path[0] === "invoices" && path.length === 1) {
      return json(demo.createInvoice(await body(request)), 201);
    }
    if (path[0] === "escrows" && path.length === 1) {
      return json(demo.createEscrow(await body(request)), 201);
    }
    if (path[0] === "escrows" && path.length === 3) {
      const [, escId, action] = path;
      if (action === "reconcile") return json(demo.reconcile(escId));
      if (action === "dispute") return json(demo.dispute(escId));
      if (action === "release") {
        const b = await body(request);
        return json(demo.release(escId, b.payeeSignature));
      }
      if (action === "refund") {
        const b = await body(request);
        return json(demo.refund(escId, b.payerSignature, String(b.mode ?? "cooperative")));
      }
    }

    throw new ApiError(404, "not_found", "no such route");
  } catch (e) {
    return fail(e);
  }
}
