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
  Pick<Project, "stack" | "wireframe" | "href" | "status">
> = {
  sletten: {
    stack: ["Next.js", "Sanity", "Vercel"],
    wireframe: ["nav", "hero", "split", "grid", "foot"],
    href: "https://slgulv.no",
    status: "live",
  },
  stenumgaard: {
    stack: ["Next.js", "Three.js", "Payload CMS"],
    wireframe: ["nav", "hero", "grid", "band", "foot"],
    status: "live",
  },
  visningsrom: {
    stack: ["Next.js", "Vercel Blob", "Sandkasse-iframes"],
    wireframe: ["nav", "band", "grid", "split", "foot"],
    href: "/visningsrom",
    status: "live",
  },
  cryptopay: {
    stack: ["Fastify", "Bitcoin", "Lightning", "OpenPGP"],
    wireframe: ["nav", "hero", "split", "band", "foot"],
    href: "/cryptopay",
    status: "wip",
  },
  gauksas: {
    stack: ["Next.js", "Sanity"],
    wireframe: ["nav", "hero", "band", "grid", "foot"],
    status: "wip",
  },
  bw: {
    stack: ["Next.js", "Sanity"],
    wireframe: ["nav", "hero", "grid", "foot"],
    status: "wip",
  },
  bondestad: {
    stack: ["Next.js", "Sanity"],
    wireframe: ["nav", "split", "grid", "band", "foot"],
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
