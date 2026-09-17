/**
 * Alt innholdet på hjemmesiden samlet ett sted, så teksten kan endres uten å
 * røre komponentene. Feltene merket TODO må fylles med ekte opplysninger.
 */

export const brand = {
  name: "Infinity Web Creations",
  short: "Infinity",
  shell: "infinity",
  tagline: "Fullstack utvikling for bedrifter som skal bli funnet og kontaktet",
  // TODO: bytt til de ekte kontaktopplysningene dine.
  email: "erlen.sletten@gmail.com",
  phone: "",
  location: "Vinstra, Gudbrandsdalen",
  orgNumber: "",
};

export const heroRotation = [
  "nettsider som laster på under ett sekund",
  "CMS eieren faktisk klarer å bruke",
  "integrasjoner mot systemene dere alt har",
  "verktøy bygget for én arbeidsdag om gangen",
];

export type Service = {
  id: string;
  command: string;
  title: string;
  body: string;
  bullets: string[];
};

export const services: Service[] = [
  {
    id: "nettsider",
    command: "cat tjenester/nettsider.md",
    title: "Nettsider med CMS",
    body:
      "Sider bygget i Next.js med Sanity bak, slik at eieren kan bytte tekst og bilder selv uten å ringe meg. Rask på mobil, synlig i søk, og laget for å få inn henvendelser.",
    bullets: ["Next.js + Sanity", "Norsk innholdsmodell", "Måling av henvendelser"],
  },
  {
    id: "verktoy",
    command: "cat tjenester/verktoy.md",
    title: "Interne verktøy",
    body:
      "Når regnearket ikke strekker til lenger: små, presise verktøy som løser én arbeidsprosess ordentlig. Bygget rundt måten dere allerede jobber på, ikke omvendt.",
    bullets: ["Dashbord og oversikter", "Skjema og godkjenning", "Tilgang og roller"],
  },
  {
    id: "integrasjoner",
    command: "cat tjenester/integrasjoner.md",
    title: "Integrasjoner",
    body:
      "Å koble sammen systemene dere alt betaler for. Ordre, timer, lager, e-post og faktura som snakker med hverandre i stedet for å bli tastet inn på nytt.",
    bullets: ["API-er og webhooks", "Datavask og import", "Jobber som går av seg selv"],
  },
  {
    id: "drift",
    command: "cat tjenester/drift.md",
    title: "Drift og videreutvikling",
    body:
      "En side er ikke ferdig når den er lansert. Overvåking, oppdateringer og små forbedringer i takt med at bedriften endrer seg.",
    bullets: ["Overvåking og varsling", "Sikkerhetsoppdateringer", "Fast kontaktpunkt"],
  },
];

export type Project = {
  id: string;
  name: string;
  sector: string;
  summary: string;
  stack: string[];
  /** Grov skisse av sidens layout, tegnet som wireframe i kortet. */
  wireframe: ("nav" | "hero" | "split" | "grid" | "band" | "foot")[];
  href?: string;
  status: "i produksjon" | "under arbeid" | "levert";
};

export const projects: Project[] = [
  {
    id: "sletten",
    name: "Sletten Gulvstøp",
    sector: "Betong og gulvstøp · Vinstra",
    summary:
      "Forside som snakker like tydelig til privatkunder og entreprenører, med totalpakker i stedet for prisliste. Eieren redigerer innholdet selv.",
    stack: ["Next.js", "Sanity", "Vercel"],
    wireframe: ["nav", "hero", "split", "grid", "foot"],
    href: "https://slgulv.no",
    status: "i produksjon",
  },
  {
    id: "stenumgaard",
    name: "Stenumgaard Design",
    sector: "3D-printing",
    summary:
      "Nettsted med produktvisning i 3D rett i nettleseren, slik at kunden kan snu på modellen før de bestiller.",
    stack: ["Next.js", "Three.js", "Payload CMS"],
    wireframe: ["nav", "hero", "grid", "band", "foot"],
    status: "i produksjon",
  },
  {
    id: "visningsrom",
    name: "Visningsrom",
    sector: "Eget verktøy",
    summary:
      "Der jeg legger nettsideforslag så kunden kan se dem side ved side i desktop-, nettbrett- og mobilbredde og svare rett under. Ligger bak innlogging på denne siden.",
    stack: ["Next.js", "Vercel Blob", "Sandkasse-iframes"],
    wireframe: ["nav", "band", "grid", "split", "foot"],
    href: "/visningsrom",
    status: "i produksjon",
  },
  {
    id: "gauksas",
    name: "Gauksås Gulvstøp",
    sector: "Betong og gulvstøp · Vinstra",
    summary:
      "Mørkere variant av det samme designsystemet, bygget rundt samarbeidet med AS Betongpumping.",
    stack: ["Next.js", "Sanity"],
    wireframe: ["nav", "hero", "band", "grid", "foot"],
    status: "under arbeid",
  },
  {
    id: "bw",
    name: "BW Betonggulv",
    sector: "Betonggulv · Vågå",
    summary:
      "Samme designsystem satt opp på nytt for et nabofirma — bevis på at grunnmuren tåler å bli gjenbrukt.",
    stack: ["Next.js", "Sanity"],
    wireframe: ["nav", "hero", "grid", "foot"],
    status: "under arbeid",
  },
  {
    id: "bondestad",
    name: "Bondestad Eiendomsservice",
    sector: "Grunnarbeid og gulvoppbygging · Vinstra",
    summary:
      "Bredere tjenestespekter enn de andre, så menyen og tjenestesidene måtte bygges om for å bære flere spor.",
    stack: ["Next.js", "Sanity"],
    wireframe: ["nav", "split", "grid", "band", "foot"],
    status: "under arbeid",
  },
];

export type Step = {
  n: string;
  title: string;
  body: string;
  duration: string;
};

export const process: Step[] = [
  {
    n: "01",
    title: "Samtale",
    body:
      "En halvtime på telefon eller på stedet. Hva skal siden gjøre for bedriften, hvem skal den snakke til, og hva er det som ikke fungerer i dag.",
    duration: "dag 1",
  },
  {
    n: "02",
    title: "Forslag",
    body:
      "Du får to retninger å velge mellom, ikke én du må si ja til. De legges i Visningsrom, så du kan se dem side ved side og svare rett under hvert forslag.",
    duration: "uke 1",
  },
  {
    n: "03",
    title: "Bygging",
    body:
      "Valgt retning bygges ferdig med ekte innhold. Du ser den vokse underveis på en egen adresse, og kan si fra før noe er spikret.",
    duration: "uke 2–4",
  },
  {
    n: "04",
    title: "Innhold og opplæring",
    body:
      "Tekst, bilder og kontaktopplysninger på plass. Så en gjennomgang av CMS-et, slik at du kan endre ting selv uten å spørre meg.",
    duration: "uke 4",
  },
  {
    n: "05",
    title: "Lansering og drift",
    body:
      "Domene, e-post, søkemotorer og måling settes opp. Etterpå følger jeg med på at det går, og gjør forbedringer i takt med bedriften.",
    duration: "løpende",
  },
];

export const nav = [
  { href: "#tjenester", label: "Tjenester" },
  { href: "#arbeid", label: "Arbeid" },
  { href: "#prosess", label: "Prosess" },
  { href: "#kontakt", label: "Kontakt" },
];

/**
 * Linjene som ruller over skjermen i åpningen. Tallene hentes fra listene
 * over, så de stemmer også etter at et prosjekt er lagt til.
 */
export const bootLines = [
  { label: "kjerne", value: "next.js 16 · react 19 · typescript" },
  { label: "grensesnitt", value: "tailwind 4 · motion · three.js" },
  { label: "tjenester", value: `${services.length} moduler lastet` },
  { label: "referanser", value: `${projects.length} prosjekter indeksert` },
  { label: "visningsrom", value: "tilkoblet" },
];
