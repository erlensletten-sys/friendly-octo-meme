import type { Content, Locale } from "./content/types";

/**
 * Administrator kan endre teksten på hjemmesiden uten å røre kodefilene.
 * Endringene lagres som et flatt kart fra sti til tekst ("hero.lead" →
 * "…") og legges oppå standardteksten fra nb.ts / en.ts ved rendering. Bare
 * felt som er endret ligger i kartet, så en ny standardtekst i koden slår
 * gjennom overalt der admin ikke har skrevet noe eget.
 *
 * Denne fila har ingen node-avhengigheter og brukes både på server og i
 * redigeringssida.
 */

export type TextOverrides = Record<string, string>;

export type TextField = {
  path: string;
  value: string;
  /** Lange tekster får tekstområde i redigeringen. */
  long: boolean;
};

/** Stier som ikke er tekst, eller som hjemmesiden er avhengig av at står. */
const SKIP = /(^|\.)(locale|id|href|src|framable|status|who|wireframe|command)$|^nav\.\d+\.href$/;

/** Går gjennom innholdet og lister alle strenger som kan redigeres. */
export function flattenContent(content: Content): TextField[] {
  const out: TextField[] = [];
  const walk = (node: unknown, path: string) => {
    if (typeof node === "string") {
      if (!SKIP.test(path)) out.push({ path, value: node, long: node.length > 60 });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, path ? `${path}.${i}` : String(i)));
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) walk(value, path ? `${path}.${key}` : key);
    }
  };
  walk(content, "");
  return out;
}

/** Legger overstyringene oppå innholdet. Ukjente stier og feil typer ignoreres. */
export function applyOverrides(content: Content, overrides: TextOverrides | null | undefined): Content {
  if (!overrides || Object.keys(overrides).length === 0) return content;
  const copy = structuredClone(content);
  for (const [path, value] of Object.entries(overrides)) {
    if (typeof value !== "string" || SKIP.test(path)) continue;
    const parts = path.split(".");
    let node: unknown = copy;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node || typeof node !== "object") {
        node = null;
        break;
      }
      node = (node as Record<string, unknown>)[parts[i]];
    }
    const last = parts[parts.length - 1];
    if (node && typeof node === "object" && typeof (node as Record<string, unknown>)[last] === "string") {
      (node as Record<string, unknown>)[last] = value;
    }
  }
  return copy;
}

/**
 * Rensker et innsendt kart: bare kjente stier, bare strenger, med tak på
 * lengde. Verdier lik standardteksten fjernes, så kartet bare inneholder det
 * som faktisk er endret.
 */
export function sanitizeOverrides(input: unknown, defaults: Content): TextOverrides {
  const known = new Map(flattenContent(defaults).map((f) => [f.path, f.value]));
  const out: TextOverrides = {};
  if (!input || typeof input !== "object") return out;
  for (const [path, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!known.has(path) || typeof raw !== "string") continue;
    const value = raw.replace(/\r\n/g, "\n").slice(0, 2000);
    if (value.trim() === "" || value === known.get(path)) continue;
    out[path] = value;
  }
  return out;
}

export const SECTION_LABELS: Record<string, string> = {
  brand: "Navn og kontakt",
  bootLines: "Åpningen – linjene på skjermen",
  heroRotation: "Hero – roterende linje",
  hero: "Hero",
  intro: "Åpningen",
  nav: "Meny",
  ui: "Knapper og etiketter",
  services: "Tjenester",
  agents: "AI-agenter",
  work: "Arbeid",
  process: "Prosess",
  contact: "Kontakt",
  footer: "Bunnlinje",
  meta: "Tittel og beskrivelse (søk)",
  support: "Support-chat",
};

export const LOCALE_LABELS: Record<Locale, string> = { nb: "Norsk", en: "English" };
