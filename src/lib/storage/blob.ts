import { del, get as blobGet, list as blobList, put as blobPut } from "@vercel/blob";
import { assertSafeKey, type StorageDriver } from "./driver";

/**
 * Lagring i Vercel Blob. Brukes automatisk når BLOB_READ_WRITE_TOKEN finnes.
 * Alt lagres som `private` slik at preview-filer bare kan leses gjennom
 * appens egne ruter, ikke via en offentlig blob-URL.
 */
export function createBlobDriver(token?: string): StorageDriver {
  const options = token ? { token } : {};

  return {
    name: "blob",

    async put(key, data, contentType) {
      const safe = assertSafeKey(key);
      const body = typeof data === "string" ? data : Buffer.from(data);
      await blobPut(safe, body, {
        ...options,
        access: "private",
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },

    async get(key) {
      const safe = assertSafeKey(key);
      try {
        const result = await blobGet(safe, { ...options, access: "private", useCache: false });
        if (!result || result.statusCode !== 200) return null;
        const buffer = await new Response(result.stream).arrayBuffer();
        return new Uint8Array(buffer);
      } catch {
        // Blob kaster BlobNotFoundError når nøkkelen ikke finnes.
        return null;
      }
    },

    async list(prefix) {
      const safe = assertSafeKey(prefix);
      const keys: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await blobList({ ...options, prefix: `${safe}/`, cursor, limit: 1000 });
        for (const blob of page.blobs) keys.push(blob.pathname);
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      return keys;
    },

    async remove(prefix) {
      const keys = await this.list(prefix);
      // del() tar maks 1000 stier per kall.
      for (let i = 0; i < keys.length; i += 1000) {
        await del(keys.slice(i, i + 1000), options);
      }
    },
  };
}
