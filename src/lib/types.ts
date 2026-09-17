export type PreviewKind = "bundle" | "url";

/** Metadata for én preview. Lagres som previews/<id>/meta.json. */
export type Preview = {
  id: string;
  kind: PreviewKind;
  /** Visningsnavn, redigerbart. */
  title: string;
  /** Firma/prosjekt previewen hører til, f.eks. "Sletten Gulvstøp". */
  group: string;
  /** Fri notat-tekst som vises i kundemodus. */
  note: string;
  /** For kind = "url": adressen som bygges inn. */
  url?: string;
  /** For kind = "bundle": relativ sti til rot-dokumentet, f.eks. "index.html". */
  entry?: string;
  /** For kind = "bundle": alle filer i pakken, relative stier. */
  files?: string[];
  /** Samlet størrelse i bytes. */
  size: number;
  /** Opprinnelig filnavn ved opplasting. */
  sourceName?: string;
  createdAt: string;
  updatedAt: string;
};

/** En delbar samling previews for kundevisning. */
export type Share = {
  token: string;
  title: string;
  intro: string;
  previewIds: string[];
  /** "gallery" = rutenett, "compare" = side ved side. */
  layout: "gallery" | "compare";
  /** Om kunden kan legge igjen kommentarer. */
  allowComments: boolean;
  createdAt: string;
};

export type Comment = {
  id: string;
  previewId: string;
  /** Token til delingen kommentaren kom fra, eller "intern". */
  shareToken: string;
  author: string;
  body: string;
  createdAt: string;
};

export const DEVICES = [
  { id: "desktop", label: "Desktop", width: 1440, height: 900 },
  { id: "laptop", label: "Laptop", width: 1280, height: 800 },
  { id: "tablet", label: "Nettbrett", width: 834, height: 1112 },
  { id: "mobile", label: "Mobil", width: 390, height: 844 },
] as const;

export type DeviceId = (typeof DEVICES)[number]["id"];

export function deviceById(id: string) {
  return DEVICES.find((d) => d.id === id) ?? DEVICES[0];
}
