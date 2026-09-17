const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  ico: "image/x-icon",
  bmp: "image/bmp",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  pdf: "application/pdf",
  webmanifest: "application/manifest+json",
};

/** Filtyper vi nekter å pakke ut fra en ZIP. */
const BLOCKED = new Set([
  "exe", "dll", "so", "dylib", "bat", "cmd", "com", "msi", "sh", "ps1",
  "jar", "app", "deb", "rpm", "scr", "vbs",
]);

export function extOf(path: string): string {
  const base = path.split("/").pop() ?? "";
  const i = base.lastIndexOf(".");
  return i === -1 ? "" : base.slice(i + 1).toLowerCase();
}

export function contentTypeFor(path: string): string {
  return TYPES[extOf(path)] ?? "application/octet-stream";
}

export function isBlockedFile(path: string): boolean {
  return BLOCKED.has(extOf(path));
}

export function isHtml(path: string): boolean {
  const e = extOf(path);
  return e === "html" || e === "htm";
}
