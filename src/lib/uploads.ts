import "server-only";
import { cleanText, newId } from "./id";
import { ALLOWED_CONTENT_TYPES, isValidUploadPathname } from "./uploadPath";
import { contentTypeFor, isHtml } from "./mime";
import { previewFileKey, savePreview } from "./store";
import { storage } from "./storage";
import { extractZip, type ExtractedBundle } from "./zip";
import type { Preview } from "./types";

export { ALLOWED_CONTENT_TYPES, isValidUploadPathname };

export function maxUploadBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB);
  return (Number.isFinite(mb) && mb > 0 ? mb : 25) * 1024 * 1024;
}

export function maxUploadLabel(): string {
  return `${Math.round(maxUploadBytes() / (1024 * 1024))} MB`;
}

export type PreviewMeta = { title: string; group: string; note: string };

export function titleFromName(name: string): string {
  return cleanText(name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), 120) || "Uten navn";
}

function baseFields(meta: PreviewMeta) {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title: meta.title || "Uten navn",
    group: meta.group,
    note: meta.note,
    createdAt: now,
    updatedAt: now,
  };
}

export async function createUrlPreview(input: PreviewMeta & { url: string }): Promise<Preview> {
  const preview: Preview = { ...baseFields(input), kind: "url", url: input.url, size: 0 };
  await savePreview(preview);
  return preview;
}

/**
 * Lager en preview av rå filbytes. Brukes både av multipart-opplastingen og av
 * finalize-steget etter en direkte opplasting til blob-lageret.
 */
export async function createBundlePreview(
  fileName: string,
  buffer: Uint8Array,
  meta: PreviewMeta,
): Promise<Preview> {
  const name = fileName.toLowerCase();

  let bundle: ExtractedBundle;
  if (name.endsWith(".zip")) {
    bundle = extractZip(buffer);
  } else if (isHtml(name)) {
    bundle = {
      entry: "index.html",
      files: [{ path: "index.html", data: buffer }],
      size: buffer.byteLength,
    };
  } else {
    throw new Error("Kun .html, .htm og .zip kan lastes opp.");
  }

  const preview: Preview = {
    ...baseFields(meta),
    kind: "bundle",
    entry: bundle.entry,
    files: bundle.files.map((entry) => entry.path),
    size: bundle.size,
    sourceName: cleanText(fileName, 200),
  };

  const driver = storage();
  // Skriver i små bolker så en stor ZIP ikke åpner tusen samtidige forespørsler.
  for (let i = 0; i < bundle.files.length; i += 16) {
    await Promise.all(
      bundle.files.slice(i, i + 16).map((entry) =>
        driver.put(previewFileKey(preview.id, entry.path), entry.data, contentTypeFor(entry.path)),
      ),
    );
  }

  await savePreview(preview);
  return preview;
}
