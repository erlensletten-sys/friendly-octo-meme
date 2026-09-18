import type { Project, ProjectStatus } from "./types";

/**
 * Det som er likt på begge språk. Kontaktopplysninger, lenker, status og
 * skisser bor her, så de bare finnes ett sted.
 */

export const brandShared = {
  name: "Infinity Web Creations",
  short: "Infinity",
  shell: "infinity",
  // TODO: bytt til de ekte kontaktopplysningene dine.
  email: "erlen.sletten@gmail.com",
  phone: "",
  orgNumber: "",
};

/** Felt per prosjekt som ikke oversettes. Teksten ligger i nb.ts / en.ts. */
export const projectShared: Record<
  string,
  Pick<Project, "stack" | "wireframe" | "href" | "preview" | "status">
> = {
  stenumgaard: {
    stack: ["Next.js", "Three.js", "Payload CMS"],
    wireframe: ["nav", "hero", "grid", "band", "foot"],
    href: "https://stenumgaarddesign.no",
    // stenumgaarddesign.no svarer med X-Frame-Options: SAMEORIGIN, så den kan
    // ikke vises i ramme herfra ennå. Sett framable: true når sida sender
    // Content-Security-Policy: frame-ancestors 'self' https://infinitywebcreations.no
    preview: { src: "https://stenumgaarddesign.no", framable: false },
    status: "live",
  },
  visningsrom: {
    stack: ["Next.js", "Vercel Blob", "Sandkasse-iframes"],
    wireframe: ["nav", "band", "grid", "split", "foot"],
    href: "/visningsrom",
    // Bak passord i produksjon, så ramma viser innloggingen. Pek den heller
    // på en kundelenke (/s/<token>) når det finnes en du vil vise fram.
    preview: { src: "/visningsrom", framable: true },
    status: "live",
  },
  cryptopay: {
    stack: ["Fastify", "Bitcoin", "Lightning", "OpenPGP"],
    wireframe: ["nav", "hero", "split", "band", "foot"],
    href: "/cryptopay",
    preview: { src: "/cryptopay/index.html", framable: true },
    status: "wip",
  },
};

export type ProjectText = { id: string; name: string; sector: string; summary: string };

export function projects(texts: ProjectText[]): Project[] {
  return texts.map((t) => {
    const shared = projectShared[t.id];
    if (!shared) throw new Error(`projectShared mangler oppføring for "${t.id}"`);
    return { ...t, ...shared };
  });
}

export const navHrefs = ["#tjenester", "#agenter", "#arbeid", "#prosess", "#kontakt"] as const;

export const PROJECT_STATUSES: ProjectStatus[] = ["live", "wip", "delivered"];
