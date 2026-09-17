/**
 * Ett enkelt nøkkel/verdi-lager for både metadata (JSON) og preview-filer.
 * Nøkler er stier med skråstrek, f.eks. "previews/ab12/files/css/style.css".
 */
export interface StorageDriver {
  readonly name: "fs" | "blob";
  put(key: string, data: Uint8Array | string, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  /** Alle nøkler under et prefiks. */
  list(prefix: string): Promise<string[]>;
  /** Sletter alt under et prefiks. */
  remove(prefix: string): Promise<void>;
}

export function assertSafeKey(key: string): string {
  const normalized = key.replace(/\\/g, "/").replace(/\/+/g, "/");
  if (
    normalized.startsWith("/") ||
    normalized.split("/").some((part) => part === ".." || part === ".")
  ) {
    throw new Error(`Ugyldig lagringsnøkkel: ${key}`);
  }
  return normalized;
}
