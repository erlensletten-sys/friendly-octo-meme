import { unzipSync } from "fflate";
import { isBlockedFile, isHtml } from "./mime";

export type ExtractedFile = { path: string; data: Uint8Array };
export type ExtractedBundle = { entry: string; files: ExtractedFile[]; size: number };

/** Maks antall filer vi pakker ut fra én ZIP. */
const MAX_ENTRIES = 3000;

function normalize(path: string): string | null {
  const clean = path.replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!clean || clean.endsWith("/")) return null;
  const parts = clean.split("/");
  if (parts.some((part) => part === ".." || part === "." || part === "")) return null;
  // Støy fra macOS og versjonskontroll.
  if (parts[0] === "__MACOSX" || parts.some((part) => part === ".git" || part === ".DS_Store")) {
    return null;
  }
  return clean;
}

/** Fjerner en felles toppmappe, slik at "min-side/index.html" blir "index.html". */
function stripCommonRoot(paths: string[]): string {
  if (paths.length === 0) return "";
  const first = paths[0].split("/");
  if (first.length < 2) return "";
  const candidate = first[0] + "/";
  return paths.every((path) => path.startsWith(candidate)) ? candidate : "";
}

/** Velger rot-dokumentet: index.html i rot, ellers den grunneste HTML-fila. */
function pickEntry(paths: string[]): string | null {
  const htmlFiles = paths.filter(isHtml);
  if (htmlFiles.length === 0) return null;
  const root = htmlFiles.find((path) => path.toLowerCase() === "index.html");
  if (root) return root;
  return htmlFiles.sort((a, b) => {
    const depth = a.split("/").length - b.split("/").length;
    if (depth !== 0) return depth;
    const aIndex = a.toLowerCase().endsWith("/index.html") ? 0 : 1;
    const bIndex = b.toLowerCase().endsWith("/index.html") ? 0 : 1;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.localeCompare(b);
  })[0];
}

export function extractZip(buffer: Uint8Array): ExtractedBundle {
  const unzipped = unzipSync(buffer);
  const collected: ExtractedFile[] = [];

  for (const [rawPath, data] of Object.entries(unzipped)) {
    if (collected.length >= MAX_ENTRIES) break;
    const path = normalize(rawPath);
    if (!path || data.byteLength === 0) continue;
    if (isBlockedFile(path)) continue;
    collected.push({ path, data });
  }

  if (collected.length === 0) {
    throw new Error("ZIP-fila inneholder ingen filer vi kan vise.");
  }

  const prefix = stripCommonRoot(collected.map((file) => file.path));
  const files = prefix
    ? collected
        .map((file) => ({ ...file, path: file.path.slice(prefix.length) }))
        .filter((file) => file.path.length > 0)
    : collected;

  const entry = pickEntry(files.map((file) => file.path));
  if (!entry) {
    throw new Error("Fant ingen HTML-fil i ZIP-pakken.");
  }

  return {
    entry,
    files,
    size: files.reduce((sum, file) => sum + file.data.byteLength, 0),
  };
}
