/** Meldingene broen i lib/inject.ts sender til foreldrevinduet. */
export type PreviewMessage =
  | { __visningsrom: true; type: "ready"; height: number; title: string }
  | { __visningsrom: true; type: "scroll"; ratio: number; top: number };
