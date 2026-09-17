import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { assertSafeKey, type StorageDriver } from "./driver";

/**
 * Lagring på lokalt filsystem. Standarden i dev og på egen server/Docker.
 * Fungerer ikke på Vercel serverless (skrivebeskyttet filsystem) - bruk Blob der.
 */
export function createFsDriver(dir: string): StorageDriver {
  const root = resolve(/* turbopackIgnore: true */ process.cwd(), dir);

  const pathFor = (key: string) => {
    const safe = assertSafeKey(key);
    // turbopackIgnore: stien er styrt av STORAGE_DIR, ikke av kildetreet.
    const full = join(/* turbopackIgnore: true */ root, safe);
    if (full !== root && !full.startsWith(root + sep)) {
      throw new Error(`Ugyldig lagringsnøkkel: ${key}`);
    }
    return full;
  };

  return {
    name: "fs",

    async put(key, data) {
      const file = pathFor(key);
      await mkdir(dirname(file), { recursive: true });
      const body = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
      await writeFile(file, body);
    },

    async get(key) {
      try {
        const buf = await readFile(pathFor(key));
        return new Uint8Array(buf);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
    },

    async list(prefix) {
      const base = pathFor(prefix);
      const out: string[] = [];
      const walk = async (absolute: string, relative: string) => {
        let entries;
        try {
          entries = await readdir(absolute, { withFileTypes: true });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
          throw error;
        }
        for (const entry of entries) {
          const nextRelative = relative ? `${relative}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            await walk(join(absolute, entry.name), nextRelative);
          } else {
            out.push(`${assertSafeKey(prefix)}/${nextRelative}`.replace(/\/+/g, "/"));
          }
        }
      };
      await walk(base, "");
      return out;
    },

    async remove(prefix) {
      await rm(pathFor(prefix), { recursive: true, force: true });
    },
  };
}
