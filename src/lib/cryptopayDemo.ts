import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import * as openpgp from "openpgp";

/**
 * Stand-in for CryptoPay-API-et, til demoen under /cryptopay.
 *
 * Svarene har samme form som det ekte API-et (se cryptopay-core/src/api), så
 * dashboard, checkout og PGP-sida kjører uendret mot dette. Forskjellen er hva
 * som ligger bak: ingen Bitcoin-node, ingen database, ingen signaturer som
 * sjekkes. Fakturaer og escrow går gjennom tilstandene sine på klokka, så en
 * som prøver får se hele løpet.
 *
 * PGP-delen er derimot ekte: nøkkelen leses, hemmeligheten krypteres til den,
 * og svaret sammenlignes i konstant tid - akkurat som i produktet. Det er den
 * delen som er verdt å vise fram, så den skal ikke være juks.
 *
 * Alt lever i minnet. På Vercel betyr det at noe du lager kan være borte på
 * neste kaldstart - de faste eksemplene er alltid der.
 */

/* ---------------------------------------------------------------- hjelpere */

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const BECH = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

/** Ser ut som en bc1q-adresse. Er det ikke. Deterministisk fra seed. */
function fakeAddress(seed: string): string {
  const h = sha("addr:" + seed);
  let out = "bc1q";
  for (let i = 0; i < 38; i++) out += BECH[parseInt(h.slice((i * 3) % 62, ((i * 3) % 62) + 2), 16) % 32];
  return out;
}

function fakeBolt11(seed: string, sats: number): string {
  let h = sha("ln:" + seed);
  let body = "";
  while (body.length < 180) {
    for (let i = 0; i + 2 <= h.length; i += 2) body += BECH[parseInt(h.slice(i, i + 2), 16) % 32];
    h = sha(h);
  }
  // bolt11: "n" er nano-bitcoin, altså 0,1 sat - så 10n per sat.
  return `lnbc${sats * 10}n1p${body}`;
}

function id(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("hex")}`;
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function crockford(bytes: Uint8Array): string {
  let bits = 0, value = 0, out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += CROCKFORD[(value << (5 - bits)) & 31];
  return out;
}

/* ------------------------------------------------------------------ kursen */

/** Kursen svinger sakte rundt 65 000 USD, så tallene ikke står bom stille. */
export function btcPriceCents(now = Date.now()): number {
  const t = now / 1000;
  const swing = Math.sin(t / 900) * 420 + Math.sin(t / 137) * 60;
  return Math.round((65_000 + swing) * 100);
}

export function priceQuote(now = Date.now()) {
  return {
    asset: "BTC",
    fiat: "USD",
    priceScaled: String(btcPriceCents(now)),
    scale: 2,
    fetchedAt: now,
    expiresAt: now + 5 * 60_000,
    sources: ["demo"],
    deviationBps: 0,
    signature: sha("sig:" + Math.floor(now / 60_000)),
    publicKey: sha("demo-oracle-key").slice(0, 64),
  };
}

const usdToSats = (cents: number, now = Date.now()) =>
  Math.max(1, Math.round((cents / btcPriceCents(now)) * 1e8));

/* ---------------------------------------------------------------- fakturaer */

type Rail = "onchain" | "lightning";
type InvoiceStatus = "AWAITING_PAYMENT" | "DETECTED" | "UNDERPAID" | "CONFIRMED" | "SETTLED" | "EXPIRED";

type Invoice = {
  id: string;
  merchantId: string;
  rail: Rail;
  amountSats: number;
  address?: string;
  bolt11?: string;
  createdAt: number;
  expiresAt: number;
  metadata?: Record<string, string>;
  /** Fast status (for eksemplene), ellers regnes den ut fra klokka. */
  fixedStatus?: InvoiceStatus;
  fixedPaidSats?: number;
};

/** Slik en ny faktura utvikler seg etter at den er laget. */
function invoiceStatus(inv: Invoice, now: number): { status: InvoiceStatus; paidSats: number } {
  if (inv.fixedStatus) return { status: inv.fixedStatus, paidSats: inv.fixedPaidSats ?? 0 };
  const age = now - inv.createdAt;
  if (inv.rail === "lightning") {
    return age > 8_000 ? { status: "SETTLED", paidSats: inv.amountSats } : { status: "AWAITING_PAYMENT", paidSats: 0 };
  }
  if (age > 26_000) return { status: "CONFIRMED", paidSats: inv.amountSats };
  if (age > 10_000) return { status: "DETECTED", paidSats: inv.amountSats };
  return { status: "AWAITING_PAYMENT", paidSats: 0 };
}

function paymentUri(inv: Invoice): string {
  if (inv.rail === "lightning") return `lightning:${inv.bolt11}`;
  return `bitcoin:${inv.address}?amount=${(inv.amountSats / 1e8).toFixed(8)}`;
}

export function serializeInvoice(inv: Invoice, now = Date.now()) {
  const { status, paidSats } = invoiceStatus(inv, now);
  return {
    id: inv.id,
    merchantId: inv.merchantId,
    rail: inv.rail,
    status,
    amountSats: String(inv.amountSats),
    paidSats: String(paidSats),
    address: inv.address,
    bolt11: inv.bolt11,
    requiredConfirmations: inv.rail === "onchain" ? 1 : 0,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    overpaid: false,
    paymentUri: paymentUri(inv),
    metadata: inv.metadata,
  };
}

export function publicInvoiceView(inv: Invoice, now = Date.now()) {
  const { status, paidSats } = invoiceStatus(inv, now);
  return {
    id: inv.id,
    rail: inv.rail,
    status,
    amountSats: String(inv.amountSats),
    amountBtc: (inv.amountSats / 1e8).toFixed(8),
    paidSats: String(paidSats),
    address: inv.address,
    bolt11: inv.bolt11,
    paymentUri: paymentUri(inv),
    expiresAt: inv.expiresAt,
  };
}

/* ------------------------------------------------------------------ escrow */

type EscrowStatus = "CREATED" | "FUNDED" | "RELEASED" | "REFUNDED";

type Escrow = {
  id: string;
  ownerId: string;
  address: string;
  witnessScript: string;
  termsHash: string;
  amountSats: number;
  locktime: number;
  feeBps: number;
  createdAt: number;
  disputed: boolean;
  /** Settes av release/refund. Før det regnes status ut fra klokka. */
  finalStatus?: "RELEASED" | "REFUNDED";
  fixedStatus?: EscrowStatus;
  releaseTxid?: string;
  refundTxid?: string;
};

const MINER_FEE_SATS = 1_200;
const ESCROW_FEE_BPS = 200; // 2 % ved release / samarbeidende refusjon
const TIMEOUT_FEE_BPS = 100; // 1 % ved tidsavbrudd

function escrowStatus(e: Escrow, now: number): EscrowStatus {
  if (e.finalStatus) return e.finalStatus;
  if (e.fixedStatus) return e.fixedStatus;
  return now - e.createdAt > 15_000 ? "FUNDED" : "CREATED";
}

export function publicEscrowView(e: Escrow, now = Date.now()) {
  const status = escrowStatus(e, now);
  return {
    id: e.id,
    status,
    address: e.address,
    amountSats: String(e.amountSats),
    fundedSats: String(status === "CREATED" ? 0 : e.amountSats),
    locktime: e.locktime,
    disputed: e.disputed,
    feeBps: e.feeBps,
    releaseTxid: e.releaseTxid,
    refundTxid: e.refundTxid,
  };
}

function spendPreview(e: Escrow, feeBps: number, kind: string) {
  const feeSats = Math.floor((e.amountSats * feeBps) / 10_000);
  const payoutSats = e.amountSats - feeSats - MINER_FEE_SATS;
  return {
    txHex: sha(`psbt:${e.id}:${kind}`).repeat(4),
    sighashHex: sha(`sighash:${e.id}:${kind}`),
    payoutSats: String(payoutSats),
    feeSats: String(feeSats),
  };
}

/* ------------------------------------------------------------------- lager */

type Store = {
  invoices: Map<string, Invoice>;
  escrows: Map<string, Escrow>;
  pgp: Map<string, { secret: string; fingerprint: string; expiresAt: number; used: boolean }>;
  seededAt: number;
};

const MERCHANT = "mrc_infinity_demo";
const ARBITER_PUB = "02" + sha("arbiter").slice(0, 64);

/** De faste eksemplene som alltid ligger der når noen åpner dashbordet. */
function seed(now: number): Store {
  const invoices = new Map<string, Invoice>();
  const mk = (
    key: string,
    rail: Rail,
    usdCents: number,
    agoMs: number,
    fixedStatus: InvoiceStatus,
    metadata?: Record<string, string>,
  ) => {
    const amountSats = usdToSats(usdCents, now - agoMs);
    const inv: Invoice = {
      id: key,
      merchantId: MERCHANT,
      rail,
      amountSats,
      address: rail === "onchain" ? fakeAddress(key) : undefined,
      bolt11: rail === "lightning" ? fakeBolt11(key, amountSats) : undefined,
      createdAt: now - agoMs,
      expiresAt: now - agoMs + 15 * 60_000,
      metadata,
      fixedStatus,
      fixedPaidSats: fixedStatus === "AWAITING_PAYMENT" || fixedStatus === "EXPIRED" ? 0 : fixedStatus === "UNDERPAID" ? Math.floor(amountSats * 0.6) : amountSats,
    };
    invoices.set(key, inv);
  };
  mk("inv_demo_coffee", "lightning", 450, 2 * 60_000, "AWAITING_PAYMENT", { orderId: "kaffe-0412" });
  mk("inv_demo_hosting", "onchain", 12_900, 40 * 60_000, "CONFIRMED", { orderId: "hosting-2026-09" });
  mk("inv_demo_domain", "onchain", 1_999, 3 * 3_600_000, "SETTLED", { orderId: "domene-infinity" });
  mk("inv_demo_late", "onchain", 7_500, 26 * 3_600_000, "EXPIRED");
  mk("inv_demo_short", "onchain", 30_000, 55 * 60_000, "UNDERPAID", { orderId: "laptop-deposit" });

  const escrows = new Map<string, Escrow>();
  const mkE = (key: string, sats: number, agoMs: number, fixedStatus: EscrowStatus, extra: Partial<Escrow> = {}) => {
    escrows.set(key, {
      id: key,
      ownerId: MERCHANT,
      address: fakeAddress(key),
      witnessScript: "5221" + sha(key + ":a").slice(0, 66) + "21" + sha(key + ":b").slice(0, 66) + "21" + ARBITER_PUB + "53ae",
      termsHash: sha("terms:" + key),
      amountSats: sats,
      locktime: 915_000 + (parseInt(sha(key).slice(0, 4), 16) % 4_000),
      feeBps: ESCROW_FEE_BPS,
      createdAt: now - agoMs,
      disputed: false,
      fixedStatus,
      ...extra,
    });
  };
  mkE("esc_demo_website", 350_000, 5 * 24 * 3_600_000, "FUNDED");
  mkE("esc_demo_laptop", 1_850_000, 12 * 24 * 3_600_000, "RELEASED", { releaseTxid: sha("txid:esc_demo_laptop") });
  mkE("esc_demo_disputed", 900_000, 2 * 24 * 3_600_000, "FUNDED", { disputed: true });

  return { invoices, escrows, pgp: new Map(), seededAt: now };
}

// globalThis, så lageret overlever hot reload i dev.
const g = globalThis as unknown as { __cryptopayDemo?: Store };
function store(): Store {
  if (!g.__cryptopayDemo) g.__cryptopayDemo = seed(Date.now());
  return g.__cryptopayDemo;
}

/* ------------------------------------------------------------------ feil */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Som i produktet: Authorization må være CPAY1. Signaturen sjekkes ikke her. */
export function requireAuth(request: Request): string {
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("CPAY1 ")) {
    throw new ApiError(401, "unauthorized", "missing or malformed CPAY1 authorization");
  }
  return MERCHANT;
}

/* ------------------------------------------------------------ operasjoner */

export const demo = {
  account() {
    const s = store();
    let spent = 0;
    for (const inv of s.invoices.values()) {
      const { status } = invoiceStatus(inv, Date.now());
      if (status === "CONFIRMED" || status === "SETTLED") spent += Math.floor(inv.amountSats / 100);
    }
    return { merchantId: MERCHANT, balanceSats: String(2_500_000 - spent), status: "active" };
  },

  listInvoices(limit: number) {
    const now = Date.now();
    return [...store().invoices.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map((inv) => serializeInvoice(inv, now));
  },

  getInvoice(idOrNull: string) {
    return store().invoices.get(idOrNull);
  },

  createInvoice(body: { amountMinor?: unknown; rail?: unknown; metadata?: unknown; fiat?: unknown }) {
    const now = Date.now();
    const cents = Number(body.amountMinor);
    if (!Number.isInteger(cents) || cents <= 0 || cents > 100_000_000) {
      throw new ApiError(400, "bad_amount", "amountMinor must be a positive integer string (cents)");
    }
    const rail = body.rail === "lightning" ? "lightning" : body.rail === "onchain" ? "onchain" : null;
    if (!rail) throw new ApiError(400, "bad_rail", 'rail must be "onchain" or "lightning"');
    let metadata: Record<string, string> | undefined;
    if (body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)) {
      metadata = {};
      for (const [k, v] of Object.entries(body.metadata as Record<string, unknown>).slice(0, 8)) {
        metadata[k.slice(0, 40)] = String(v).slice(0, 120);
      }
    }
    const invId = id("inv");
    const amountSats = usdToSats(cents, now);
    const inv: Invoice = {
      id: invId,
      merchantId: MERCHANT,
      rail,
      amountSats,
      address: rail === "onchain" ? fakeAddress(invId) : undefined,
      bolt11: rail === "lightning" ? fakeBolt11(invId, amountSats) : undefined,
      createdAt: now,
      expiresAt: now + 15 * 60_000,
      metadata,
    };
    const s = store();
    s.invoices.set(invId, inv);
    trim(s.invoices, 60);
    const q = priceQuote(now);
    return {
      ...serializeInvoice(inv, now),
      price: { asset: "BTC", fiat: "USD", priceScaled: q.priceScaled, scale: 2, expiresAt: q.expiresAt },
    };
  },

  listEscrows() {
    const now = Date.now();
    return [...store().escrows.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((e) => publicEscrowView(e, now));
  },

  getEscrow(escId: string) {
    return store().escrows.get(escId);
  },

  createEscrow(body: Record<string, unknown>) {
    const now = Date.now();
    const sats = Number(body.amountSats);
    if (!Number.isInteger(sats) || sats < 10_000) {
      throw new ApiError(400, "bad_amount", "amountSats must be an integer of at least 10000");
    }
    for (const field of ["payerPub", "payeePub", "payeePayoutAddress", "payerRefundAddress"]) {
      if (typeof body[field] !== "string" || (body[field] as string).length < 8) {
        throw new ApiError(400, "bad_request", `${field} is required`);
      }
    }
    const timeoutBlocks = Number(body.timeoutBlocks);
    if (!Number.isInteger(timeoutBlocks) || timeoutBlocks < 6) {
      throw new ApiError(400, "bad_timeout", "timeoutBlocks must be an integer of at least 6");
    }
    const escId = id("esc");
    const e: Escrow = {
      id: escId,
      ownerId: MERCHANT,
      address: fakeAddress(escId),
      witnessScript: "5221" + sha(String(body.payerPub)).slice(0, 66) + "21" + sha(String(body.payeePub)).slice(0, 66) + "21" + ARBITER_PUB + "53ae",
      termsHash: sha("terms:" + escId),
      amountSats: sats,
      locktime: 917_400 + timeoutBlocks,
      feeBps: ESCROW_FEE_BPS,
      createdAt: now,
      disputed: false,
    };
    const s = store();
    s.escrows.set(escId, e);
    trim(s.escrows, 40);
    return {
      id: e.id,
      address: e.address,
      witnessScript: e.witnessScript,
      termsHash: e.termsHash,
      amountSats: String(e.amountSats),
      locktime: e.locktime,
      feeBps: e.feeBps,
      arbiterPub: ARBITER_PUB,
      arbiterFeeAddress: fakeAddress("arbiter-fee"),
      status: "CREATED",
    };
  },

  reconcile(escId: string) {
    const e = mustEscrow(escId);
    return publicEscrowView(e);
  },

  releaseTx(escId: string) {
    const e = mustEscrow(escId);
    mustBeFunded(e);
    return spendPreview(e, ESCROW_FEE_BPS, "release");
  },

  refundTx(escId: string, mode: string) {
    const e = mustEscrow(escId);
    mustBeFunded(e);
    return spendPreview(e, mode === "timeout" ? TIMEOUT_FEE_BPS : ESCROW_FEE_BPS, "refund:" + mode);
  },

  release(escId: string, signature: unknown) {
    const e = mustEscrow(escId);
    mustBeFunded(e);
    mustLookLikeSignature(signature);
    e.finalStatus = "RELEASED";
    e.releaseTxid = sha(`txid:release:${e.id}:${Date.now()}`);
    return { txid: e.releaseTxid, status: "RELEASED" };
  },

  refund(escId: string, signature: unknown, mode: string) {
    const e = mustEscrow(escId);
    mustBeFunded(e);
    mustLookLikeSignature(signature);
    e.finalStatus = "REFUNDED";
    e.refundTxid = sha(`txid:refund:${mode}:${e.id}:${Date.now()}`);
    return { txid: e.refundTxid, status: "REFUNDED" };
  },

  dispute(escId: string) {
    const e = mustEscrow(escId);
    e.disputed = true;
    return publicEscrowView(e);
  },

  /* ---- PGP: ekte, samme flyt som produktet ---- */

  async pgpChallenge(publicKey: unknown) {
    if (typeof publicKey !== "string" || publicKey.trim() === "") {
      throw new ApiError(400, "pgp_bad_key", "paste an ASCII-armored PGP public key");
    }
    if (publicKey.length > 64_000) throw new ApiError(400, "pgp_bad_key", "public key is too large");
    const armored = publicKey.trim();
    if (/BEGIN PGP PRIVATE KEY BLOCK/.test(armored)) {
      throw new ApiError(400, "pgp_private_key", "that looks like a PRIVATE key — paste your PUBLIC key only, never your private key");
    }
    if (!/BEGIN PGP PUBLIC KEY BLOCK/.test(armored)) {
      throw new ApiError(400, "pgp_bad_key", "expected an ASCII-armored PGP public key block");
    }
    let key: openpgp.Key;
    try {
      key = await openpgp.readKey({ armoredKey: armored });
    } catch {
      throw new ApiError(400, "pgp_bad_key", "could not parse that PGP key");
    }
    if (key.isPrivate()) throw new ApiError(400, "pgp_private_key", "that is a PRIVATE key — paste your PUBLIC key only");

    const secret = "CPAY-" + (crockford(randomBytes(15)).match(/.{1,4}/g) ?? []).join("-");
    let ciphertext: string;
    try {
      ciphertext = (await openpgp.encrypt({
        message: await openpgp.createMessage({ text: secret }),
        encryptionKeys: key,
        format: "armored",
      })) as string;
    } catch {
      throw new ApiError(400, "pgp_cannot_encrypt", "this key cannot receive an encrypted message (no valid encryption subkey, or it is expired/revoked)");
    }
    const fingerprint = key.getFingerprint().toLowerCase();
    const challengeId = crockford(randomBytes(15)).toLowerCase();
    const expiresAt = Date.now() + 10 * 60_000;
    const s = store();
    s.pgp.set(challengeId, { secret, fingerprint, expiresAt, used: false });
    for (const [k, v] of s.pgp) if (v.expiresAt < Date.now()) s.pgp.delete(k);
    return {
      challengeId,
      ciphertext,
      fingerprint,
      keyId: fingerprint.slice(-16).toUpperCase(),
      userIds: key.getUserIDs(),
      expiresAt,
    };
  },

  pgpVerify(challengeId: unknown, decrypted: unknown): { ok: true; fingerprint: string } | { ok: false; reason: string } {
    if (typeof challengeId !== "string" || typeof decrypted !== "string") {
      throw new ApiError(400, "pgp_bad_request", "challengeId and decrypted are required");
    }
    if (decrypted.length > 4_000) throw new ApiError(400, "pgp_bad_request", "decrypted value is too large");
    const c = store().pgp.get(challengeId);
    if (!c) return { ok: false, reason: "unknown_or_expired" };
    if (c.used) return { ok: false, reason: "already_used" };
    if (c.expiresAt < Date.now()) return { ok: false, reason: "expired" };
    const got = Buffer.from(decrypted.trim(), "utf8");
    const want = Buffer.from(c.secret, "utf8");
    if (got.length === want.length && timingSafeEqual(got, want)) {
      c.used = true;
      return { ok: true, fingerprint: c.fingerprint };
    }
    return { ok: false, reason: "mismatch" };
  },
};

function mustEscrow(escId: string): Escrow {
  const e = store().escrows.get(escId);
  if (!e) throw new ApiError(404, "not_found", "escrow not found");
  return e;
}

function mustBeFunded(e: Escrow) {
  const status = escrowStatus(e, Date.now());
  if (status !== "FUNDED") {
    throw new ApiError(409, "bad_state", `escrow is ${status}; it must be FUNDED`);
  }
}

function mustLookLikeSignature(signature: unknown) {
  if (typeof signature !== "string" || !/^30[0-9a-f]{60,150}0[1-3]$/i.test(signature.trim())) {
    throw new ApiError(400, "bad_signature", "signature must be DER-encoded hex ending in a sighash byte (30…01). In this demo any well-formed one is accepted.");
  }
}

/** Nyeste beholdes, så lageret ikke vokser fritt. Eksemplene ryker aldri. */
function trim<T extends { createdAt: number; id: string }>(map: Map<string, T>, max: number) {
  if (map.size <= max) return;
  const removable = [...map.values()].filter((v) => !v.id.includes("_demo_")).sort((a, b) => a.createdAt - b.createdAt);
  for (const v of removable.slice(0, map.size - max)) map.delete(v.id);
}
