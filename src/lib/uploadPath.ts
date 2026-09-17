/**
 * Delt mellom nettleser og server, så begge sider er enige om hvordan en
 * midlertidig opplastingssti ser ut. Ingen node-avhengigheter her.
 */

/** Midlertidig mappe for filer som lastes opp direkte til blob-lageret. */
export const UPLOAD_PREFIX = "uploads";

/** Filtyper vi tar imot. Alt annet avvises før opplastingen starter. */
export const ALLOWED_CONTENT_TYPES = [
  "text/html",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
];

const PATHNAME_PATTERN = new RegExp(
  `^${UPLOAD_PREFIX}/[a-z0-9]{10,32}/[^/]{1,200}\\.(html|htm|zip)$`,
  "i",
);

/**
 * Stier klienten kan laste opp til. Fordi finalize-ruta leser rett fra lageret,
 * må denne være stram: bare uploads/<tilfeldig>/<filnavn> med kjent filtype.
 */
export function isValidUploadPathname(pathname: string): boolean {
  return PATHNAME_PATTERN.test(pathname);
}

export function safeUploadName(fileName: string): string {
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
  return /\.(html|htm|zip)$/i.test(cleaned) ? cleaned : "opplasting.zip";
}

export function buildUploadPathname(fileName: string, randomId: string): string {
  return `${UPLOAD_PREFIX}/${randomId}/${safeUploadName(fileName)}`;
}

/** Tilfeldig id som passer mønsteret over. Bruker Web Crypto der det finnes. */
export function randomUploadId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
