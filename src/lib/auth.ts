export const ADMIN_COOKIE = "vr_admin";

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

/** Uten ADMIN_PASSWORD er admin-delen åpen. Greit lokalt, ikke i produksjon. */
export function authEnabled(): boolean {
  return adminPassword().length > 0;
}

/**
 * Cookie-verdien vi forventer: en hash av passordet, ikke passordet selv.
 * Web Crypto finnes både i Node- og Edge-runtime, så middleware og API-ruter
 * kan bruke samme funksjon.
 */
export async function sessionToken(password = adminPassword()): Promise<string> {
  const data = new TextEncoder().encode(`visningsrom:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Sammenligning i konstant tid, så cookien ikke kan gjettes byte for byte. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
