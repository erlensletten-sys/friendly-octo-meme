/**
 * Det som deles mellom måleskriptet i nettleseren og mottakeren på serveren.
 * Ingenting her er hemmelig - fila havner i klientbunten.
 */

/** Kanonisk adresse. Kopier av sida melder fra hit, og sendes hit. */
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "https://infinitywebcreations.no").replace(
  /\/+$/,
  "",
);

export const TRACK_PATH = "/api/public/track";

/** Stier som ikke skal måles: eierens egne verktøy og filene previewene består av. */
export const UNTRACKED_PREFIXES = ["/visningsrom", "/login", "/serve", "/api"];

/** Seksjonene på hjemmesiden vi måler rekkevidde for, i den rekkefølgen de står. */
export const SECTIONS = ["tjenester", "arbeid", "prosess", "kontakt"] as const;

export const MAX_CLICKS = 40;

/**
 * Vertsnavn sida har lov til å kjøre på. Alt annet regnes som en kopi.
 * Vercel eksponerer forhåndsvisnings- og produksjonsadressene som
 * NEXT_PUBLIC_VERCEL_*, så de trenger ikke listes opp for hånd.
 */
export function allowedHosts(): string[] {
  const hosts = new Set<string>(["localhost", "127.0.0.1", "[::1]"]);
  const add = (value: string | undefined) => {
    for (const part of (value ?? "").split(",")) {
      const host = part.trim().replace(/^https?:\/\//, "").replace(/[/:].*$/, "").toLowerCase();
      if (!host) continue;
      hosts.add(host);
      hosts.add(host.startsWith("www.") ? host.slice(4) : `www.${host}`);
    }
  };
  add(SITE_ORIGIN);
  add(process.env.NEXT_PUBLIC_ALLOWED_HOSTS);
  add(process.env.NEXT_PUBLIC_VERCEL_URL);
  add(process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL);
  add(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL);
  return [...hosts];
}

export type ClickRecord = {
  /** Synlig tekst eller aria-label, forkortet. */
  label: string;
  /** Lenkemål, hvis det var en lenke. */
  href?: string;
  /** Seksjonen klikket skjedde i. */
  section?: string;
  /** Millisekunder etter at sidevisningen startet. */
  at: number;
};

/** Én sidevisning slik nettleseren sender den. Sendes på nytt med samme id når den oppdateres. */
export type PageviewBeacon = {
  kind: "pageview";
  /** `<start i base36>-<tilfeldig>`. Samme id overskriver forrige versjon. */
  id: string;
  path: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  screenW: number;
  lang: string;
  /** Tid med fanen synlig og en bruker som faktisk er der. */
  activeMs: number;
  /** Dypeste scroll, 0-100. */
  scroll: number;
  sections: string[];
  clicks: ClickRecord[];
};

/** Sida kjører på et vertsnavn som ikke er vårt. */
export type CloneBeacon = {
  kind: "clone";
  host: string;
  href: string;
  referrer: string;
};

export type Beacon = PageviewBeacon | CloneBeacon;
