import "server-only";
import { newId } from "./id";
import { storage } from "./storage";
import type { Comment, Preview, Share } from "./types";

const JSON_TYPE = "application/json; charset=utf-8";
const decoder = new TextDecoder();

async function readJson<T>(key: string): Promise<T | null> {
  const bytes = await storage().get(key);
  if (!bytes) return null;
  try {
    return JSON.parse(decoder.decode(bytes)) as T;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await storage().put(key, JSON.stringify(value, null, 2), JSON_TYPE);
}

/* ------------------------------------------------------------------ previews */

const previewMetaKey = (id: string) => `previews/${id}/meta.json`;
export const previewFileKey = (id: string, path: string) => `previews/${id}/files/${path}`;

export async function getPreview(id: string): Promise<Preview | null> {
  if (!/^[a-z0-9]{4,32}$/.test(id)) return null;
  return readJson<Preview>(previewMetaKey(id));
}

export async function savePreview(preview: Preview): Promise<void> {
  await writeJson(previewMetaKey(preview.id), preview);
}

export async function listPreviews(): Promise<Preview[]> {
  const keys = await storage().list("previews");
  const metaKeys = keys.filter((key) => key.endsWith("/meta.json"));
  const previews = await Promise.all(metaKeys.map((key) => readJson<Preview>(key)));
  return previews
    .filter((preview): preview is Preview => Boolean(preview))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPreviews(ids: string[]): Promise<Preview[]> {
  const found = await Promise.all(ids.map((id) => getPreview(id)));
  return found.filter((preview): preview is Preview => Boolean(preview));
}

export async function deletePreview(id: string): Promise<void> {
  const preview = await getPreview(id);
  if (!preview) return;
  await storage().remove(`previews/${id}`);
  await storage().remove(`comments/${id}`);
}

export async function readPreviewFile(id: string, path: string): Promise<Uint8Array | null> {
  return storage().get(previewFileKey(id, path));
}

/* -------------------------------------------------------------------- shares */

const shareKey = (token: string) => `shares/${encodeURIComponent(token)}.json`;

export async function getShare(token: string): Promise<Share | null> {
  // Hemmelige tokens er 32 tegn; valgte slugs (offentlige utstillinger) kan
  // være ned til 6. Alt under det, eller med andre tegn, er ikke en deling.
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(token)) return null;
  return readJson<Share>(shareKey(token));
}

export async function saveShare(share: Share): Promise<void> {
  await writeJson(shareKey(share.token), share);
}

export async function listShares(): Promise<Share[]> {
  const keys = await storage().list("shares");
  const shares = await Promise.all(keys.map((key) => readJson<Share>(key)));
  return shares
    .filter((share): share is Share => Boolean(share))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteShare(token: string): Promise<void> {
  const share = await getShare(token);
  if (!share) return;
  await storage().remove(`shares/${encodeURIComponent(token)}.json`);
}

/* ------------------------------------------------------------------ comments */

export async function listComments(previewId: string): Promise<Comment[]> {
  const keys = await storage().list(`comments/${previewId}`);
  const comments = await Promise.all(keys.map((key) => readJson<Comment>(key)));
  return comments
    .filter((comment): comment is Comment => Boolean(comment))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listCommentsFor(previewIds: string[]): Promise<Record<string, Comment[]>> {
  const entries = await Promise.all(
    previewIds.map(async (id) => [id, await listComments(id)] as const),
  );
  return Object.fromEntries(entries);
}

export async function addComment(
  input: Omit<Comment, "id" | "createdAt">,
): Promise<Comment> {
  const comment: Comment = { ...input, id: newId(12), createdAt: new Date().toISOString() };
  await writeJson(`comments/${comment.previewId}/${comment.id}.json`, comment);
  return comment;
}

export async function deleteComment(previewId: string, commentId: string): Promise<void> {
  if (!/^[a-z0-9]{4,32}$/.test(commentId)) return;
  await storage().remove(`comments/${previewId}/${commentId}.json`);
}
