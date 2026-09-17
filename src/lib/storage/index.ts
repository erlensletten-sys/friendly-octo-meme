import "server-only";
import { createBlobDriver } from "./blob";
import { createFsDriver } from "./fs";
import type { StorageDriver } from "./driver";

let cached: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (cached) return cached;

  const forced = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (forced === "blob" || (!forced && token)) {
    if (!token) {
      throw new Error(
        "STORAGE_DRIVER=blob krever BLOB_READ_WRITE_TOKEN. Koble til Vercel Blob under Storage i prosjektet.",
      );
    }
    cached = createBlobDriver(token);
  } else {
    cached = createFsDriver(process.env.STORAGE_DIR?.trim() || ".data");
  }

  return cached;
}

export type { StorageDriver };

/** Hvilken lagringsdriver som er aktiv. Brukes til å velge opplastingsmetode. */
export function storageName(): StorageDriver["name"] {
  return storage().name;
}
