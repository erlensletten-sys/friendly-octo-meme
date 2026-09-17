/**
 * Sperre for innloggingsforsøk.
 *
 * Passordet er kort og menneskelig, så det som beskytter admin-delen er at
 * gjetting går sakte. Tre lag:
 *
 *  1. Hvert feilforsøk svarer tregere enn det forrige (eksponentiell venting).
 *  2. Etter FORSOK_FOR_SPERRE feil fra samme IP er IP-en sperret en periode.
 *  3. En global teller fanger opp forsøk spredt over mange IP-er.
 *
 * Tellerne lever i minnet til instansen. På Vercel betyr det at de nullstilles
 * ved kaldstart og ikke deles mellom instanser - sperra er altså en bremse, ikke
 * en garanti. Skal dette bli hardt, må tellerne flyttes til lageret i
 * `src/lib/storage/`.
 */

const VINDU_MS = 15 * 60 * 1000; // hvor lenge et feilforsøk teller med
const FORSOK_FOR_SPERRE = 5; // feil per IP før sperra slår inn
const SPERRE_MIN_MS = 30 * 1000; // første sperreperiode
const SPERRE_MAKS_MS = 30 * 60 * 1000; // taket, uansett hvor mange forsøk
const GLOBALT_TAK = 60; // feil fra alle IP-er til sammen per vindu
const VENTE_TAK_MS = 2000; // lengste forsinkelse på ett enkelt svar
const MAKS_NOKLER = 5000; // så kartet ikke vokser fritt

type Oppforing = {
  feil: number;
  sist: number;
  sperretTil: number;
};

const forsok = new Map<string, Oppforing>();
let globaleFeil: { antall: number; vindu: number } = { antall: 0, vindu: 0 };

/** Klientens IP slik plattformen ser den. Bak Vercel er første ledd klienten. */
export function klientNokkel(request: Request): string {
  const videresendt = request.headers.get("x-forwarded-for");
  if (videresendt) {
    const forste = videresendt.split(",")[0]?.trim();
    if (forste) return forste;
  }
  return request.headers.get("x-real-ip")?.trim() || "ukjent";
}

function ryddOpp(na: number) {
  if (forsok.size < MAKS_NOKLER) {
    for (const [nokkel, oppforing] of forsok) {
      if (na - oppforing.sist > VINDU_MS && oppforing.sperretTil < na) {
        forsok.delete(nokkel);
      }
    }
    return;
  }
  // Nødbrems: kartet er fullt, og da er det eldste som ryker først.
  const sortert = [...forsok.entries()].sort((a, b) => a[1].sist - b[1].sist);
  for (const [nokkel] of sortert.slice(0, Math.ceil(MAKS_NOKLER / 4))) {
    forsok.delete(nokkel);
  }
}

export type Vurdering =
  | { tillatt: true; ventMs: number }
  | { tillatt: false; ventMs: number; sperretISekunder: number };

/**
 * Spør før passordet sjekkes: er denne klienten sperret, og hvor lenge skal
 * svaret vente hvis forsøket viser seg å være feil?
 */
export function vurderForsok(nokkel: string, na = Date.now()): Vurdering {
  ryddOpp(na);

  if (na - globaleFeil.vindu > VINDU_MS) {
    globaleFeil = { antall: 0, vindu: na };
  }

  const oppforing = forsok.get(nokkel);

  if (oppforing && oppforing.sperretTil > na) {
    return {
      tillatt: false,
      ventMs: 0,
      sperretISekunder: Math.ceil((oppforing.sperretTil - na) / 1000),
    };
  }

  // Har det gått et helt vindu siden sist, starter klienten med blanke ark.
  const feil = oppforing && na - oppforing.sist <= VINDU_MS ? oppforing.feil : 0;

  // Globalt tak: mange feil fordelt på mange IP-er. Klienter som allerede har
  // bommet blir stengt ute, mens en klient uten feil bak seg slipper gjennom
  // med full venting - ellers kunne et spredt angrep låst eieren ute av sitt
  // eget verktøy.
  if (globaleFeil.antall >= GLOBALT_TAK) {
    if (feil > 0) {
      return {
        tillatt: false,
        ventMs: 0,
        sperretISekunder: Math.ceil((globaleFeil.vindu + VINDU_MS - na) / 1000),
      };
    }
    return { tillatt: true, ventMs: VENTE_TAK_MS };
  }

  // 0 → 0 ms, 1 → 250, 2 → 500, 3 → 1000 … opp til taket.
  const ventMs = feil === 0 ? 0 : Math.min(VENTE_TAK_MS, 125 * 2 ** feil);
  return { tillatt: true, ventMs };
}

/** Kalles når passordet var feil. Returnerer hvor lenge klienten nå er sperret. */
export function registrerFeil(nokkel: string, na = Date.now()): number {
  const forrige = forsok.get(nokkel);
  const feil = forrige && na - forrige.sist <= VINDU_MS ? forrige.feil + 1 : 1;

  let sperretTil = 0;
  if (feil >= FORSOK_FOR_SPERRE) {
    const trinn = feil - FORSOK_FOR_SPERRE;
    sperretTil = na + Math.min(SPERRE_MAKS_MS, SPERRE_MIN_MS * 2 ** trinn);
  }

  forsok.set(nokkel, { feil, sist: na, sperretTil });
  globaleFeil.antall += 1;
  return sperretTil;
}

/** Kalles ved riktig passord. Klienten starter på null igjen. */
export function nullstill(nokkel: string) {
  forsok.delete(nokkel);
}

export function vent(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

/** Bare for tester. */
export function tomTellere() {
  forsok.clear();
  globaleFeil = { antall: 0, vindu: 0 };
}
