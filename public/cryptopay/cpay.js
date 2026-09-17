/**
 * CryptoPay browser client — ZERO dependencies. Uses the native Web Crypto API
 * for CPAY1 request signing (byte-identical to the server). No bundler, no
 * libraries, no web fonts — safe and fast over Tor.
 *
 * Security note: signing happens client-side, so the API secret lives in this
 * page's memory (sessionStorage, cleared on tab close). Intended for a merchant
 * operating their OWN account. A public multi-tenant dashboard should instead
 * sign on a session backend. This never touches Bitcoin private keys — escrow
 * parties sign sighashes with their own tools and paste only the signature.
 */
const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function sha256hex(str) {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(str)));
}
async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
async function canonical(method, path, query, body, keyId, ts, nonce) {
  const bodyHash = await sha256hex(body);
  return ['CPAY1', method.toUpperCase(), path, query || '', bodyHash, keyId, String(ts), nonce].join('\n');
}
export async function authHeader(secret, { method, path, query, body, keyId, ts, nonce }) {
  const sig = await hmacHex(secret, await canonical(method, path, query || '', body || '', keyId, ts, nonce));
  return `CPAY1 keyId=${keyId},ts=${ts},nonce=${nonce},sig=${sig}`;
}

export class Api {
  constructor({ baseUrl, keyId, secret }) {
    this.baseUrl = (baseUrl || '').replace(/\/$/, '');
    this.keyId = keyId;
    this.secret = secret;
  }
  async _signed(method, path, body) {
    const raw = body === undefined ? '' : JSON.stringify(body);
    const [p, q = ''] = path.split('?');
    const ts = Date.now();
    const nonce = (crypto.randomUUID ? crypto.randomUUID() : String(ts) + Math.random());
    const authorization = await authHeader(this.secret, { method, path: p, query: q, body: raw, keyId: this.keyId, ts, nonce });
    const res = await fetch(this.baseUrl + path, {
      method, headers: { 'content-type': 'application/json', authorization }, body: body === undefined ? undefined : raw,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw Object.assign(new Error(json?.error?.message || res.statusText), { code: json?.error?.code, status: res.status });
    return json;
  }
  async _public(path) {
    const res = await fetch(this.baseUrl + path, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }
  async _publicPost(path, body) {
    const res = await fetch(this.baseUrl + path, {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw Object.assign(new Error(json?.error?.message || json?.reason || res.statusText), { code: json?.error?.code, reason: json?.reason, status: res.status });
    return json;
  }
  // pgp verification (public — proving control of the key is the auth; no keyId/secret needed)
  pgpChallenge(publicKey) { return this._publicPost('/v1/pgp/challenge', { publicKey }); }
  pgpVerify(challengeId, decrypted) { return this._publicPost('/v1/pgp/verify', { challengeId, decrypted }); }
  // account + invoices (BTC)
  account() { return this._signed('GET', '/v1/account'); }
  price() { return this._public('/v1/prices/BTC'); }
  listInvoices(limit = 50) { return this._signed('GET', `/v1/invoices?limit=${limit}`); }
  createInvoice(body) { return this._signed('POST', '/v1/invoices', body); }
  invoiceStatus(id) { return this._public(`/v1/checkout/${encodeURIComponent(id)}`); }
  // escrow
  listEscrows() { return this._signed('GET', '/v1/escrows'); }
  createEscrow(body) { return this._signed('POST', '/v1/escrows', body); }
  escrowStatus(id) { return this._public(`/v1/escrows/${encodeURIComponent(id)}`); }
  reconcileEscrow(id) { return this._signed('POST', `/v1/escrows/${encodeURIComponent(id)}/reconcile`); }
  releaseTx(id) { return this._signed('GET', `/v1/escrows/${encodeURIComponent(id)}/release-tx`); }
  release(id, payeeSignature) { return this._signed('POST', `/v1/escrows/${encodeURIComponent(id)}/release`, { payeeSignature }); }
  refundTx(id, mode = 'cooperative') { return this._signed('GET', `/v1/escrows/${encodeURIComponent(id)}/refund-tx?mode=${mode}`); }
  refund(id, payerSignature, mode = 'cooperative') { return this._signed('POST', `/v1/escrows/${encodeURIComponent(id)}/refund`, { payerSignature, mode }); }
  dispute(id) { return this._signed('POST', `/v1/escrows/${encodeURIComponent(id)}/dispute`); }
}
