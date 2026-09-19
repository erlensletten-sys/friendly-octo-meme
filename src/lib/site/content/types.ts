/**
 * Formen på alt innhold på hjemmesiden. nb.ts og en.ts må begge fylle den
 * helt - TypeScript sier fra om en oversettelse mangler et felt.
 *
 * Det som ikke er tekst (lenker, status-koder, skisser) ligger i shared.ts
 * og flettes inn i begge språk, så det bare finnes ett sted.
 */

export type Locale = "nb" | "en";

export type Brand = {
  name: string;
  short: string;
  shell: string;
  tagline: string;
  email: string;
  phone: string;
  location: string;
  orgNumber: string;
};

export type BootLine = { label: string; value: string };

export type Service = {
  id: string;
  command: string;
  title: string;
  body: string;
  bullets: string[];
};

export type ProjectStatus = "live" | "wip" | "delivered";

export type Project = {
  id: string;
  name: string;
  sector: string;
  summary: string;
  stack: string[];
  /** Grov skisse av sidens layout. Brukes når sida ikke kan vises i ramme. */
  wireframe: ("nav" | "hero" | "split" | "grid" | "band" | "foot")[];
  href?: string;
  /**
   * Sida selv, vist i en nedskalert iframe i kortet. `framable: false` når
   * sida sender X-Frame-Options/frame-ancestors som nekter oss - da vises
   * skissen i stedet, til headeren er endret.
   */
  preview?: { src: string; framable: boolean };
  status: ProjectStatus;
};

export type Step = { n: string; title: string; body: string; duration: string };

/** En replikk i eksempelloggen på et agentkort. */
export type AgentLine = { who: "kunde" | "agent" | "system"; text: string };

export type Agent = {
  id: string;
  command: string;
  title: string;
  body: string;
  /** Kort utdrag av hva agenten gjør i praksis, vist som terminallogg. */
  log: AgentLine[];
  bullets: string[];
};

export type Content = {
  locale: Locale;
  brand: Brand;
  bootLines: BootLine[];
  heroRotation: string[];
  hero: {
    whoami: string;
    /** Overskriften i tre deler: før, uthevet, etter. */
    title: [string, string, string];
    buildsPrefix: string;
    lead: string;
    ctaWork: string;
    ctaContact: string;
    available: string;
    scroll: string;
  };
  intro: { skip: string };
  nav: { href: string; label: string }[];
  ui: {
    skipToContent: string;
    visningsrom: string;
    contact: string;
    openMenu: string;
    closeMenu: string;
    mainMenu: string;
    mobileMenu: string;
    open: string;
    switchLanguage: string;
  };
  services: { command: string; title: string; lead: string; items: Service[] };
  agents: {
    command: string;
    title: string;
    lead: string;
    items: Agent[];
    howTitle: string;
    how: { title: string; body: string }[];
    priceLabel: string;
    /** TODO i content: fylles med ekte pris. Tom streng skjuler linja. */
    price: string;
    priceNote: string;
    cta: string;
    exampleNote: string;
    speaker: { kunde: string; agent: string; system: string };
  };
  work: {
    command: string;
    title: string;
    lead: string;
    status: Record<ProjectStatus, string>;
    items: Project[];
  };
  process: { command: string; title: string; lead: string; note: string; steps: Step[] };
  contact: {
    command: string;
    title: string;
    lead: string;
    labels: { email: string; phone: string; place: string; response: string };
    responseTime: string;
    form: {
      name: string;
      company: string;
      optional: string;
      message: string;
      namePlaceholder: string;
      companyPlaceholder: string;
      messagePlaceholder: string;
      send: string;
      incomplete: string;
      footnote: string;
      /** Emnefeltet i e-posten: "<subjectPrefix> <navn> (<firma>)". */
      subjectPrefix: string;
      /** Brukes som navn når feltet står tomt. */
      subjectFallback: string;
    };
  };
  footer: { orgNumber: string };
  meta: { title: string; description: string };
  support: {
    /** Knappen nede til høyre. */
    open: string;
    close: string;
    title: string;
    /** Første melding fra agenten. */
    greeting: string;
    placeholder: string;
    send: string;
    /** Vises når ANTHROPIC_API_KEY mangler. */
    offline: string;
    error: string;
    tooMany: string;
    /** Liten linje under chatten. */
    disclaimer: string;
    /** Slik agenten skal presentere seg og oppføre seg. Kan endres av admin. */
    persona: string;
  };
};
