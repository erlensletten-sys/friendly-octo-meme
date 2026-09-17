# Infinity Web Creations — regler for arbeid i dette repoet

Dette er regelsettet en agent (eller et menneske) skal lese **før** det skrives
kode her. Det beskriver systemet slik det faktisk er i koden i dag, ikke slik det
kunne vært. Er du i tvil om en verdi: åpne kilden i tabellen under, ikke gjett.
`README.md` forklarer hva prosjektet er og hvordan det kjøres; denne fila
forklarer hvordan det skal bygges videre.

## 0. Arbeidsflyt

- `npm run typecheck` før hver commit. Det er den eneste porten som finnes —
  ESLint er ikke satt opp ennå.
- Commit-meldinger og kodekommentarer på norsk. Kommentarer forklarer *hvorfor*,
  ikke *hva*.
- Hemmeligheter (`ADMIN_PASSWORD`, blob-token) hører hjemme i `.env.local` eller
  i miljøvariablene hos Vercel — aldri i en commit. `.env.example` viser bare
  navnene.
- Endrer du noe README-en beskriver, oppdater README-en i samme commit.

| Sannhetskilde | Hva den eier |
| --- | --- |
| `src/app/globals.css` | Fargetokens, radier, fonter og alle egendefinerte utilities (`panel`, `field`, `mono`, `edge-glow`, `scanlines`, `loop-text`, `caret`, `grain`). |
| `src/lib/site/content.ts` | All tekst på hjemmesiden. Ingen synlig streng skal skrives i en komponent. |
| `src/components/ui.tsx` | Knappeklasser og primitiver for Visningsrom (`btnPrimary`, `Panel`, `PageHeader`, `EmptyState`). |
| `src/components/site/Terminal.tsx` | `TerminalChrome` — vindusramma som går igjen over hele hjemmesiden. |
| `src/components/site/SectionHead.tsx` | Kommandolinje + overskrift + ingress øverst i hver seksjon. |

Stack: Next.js 16 (App Router), React 19.2, Tailwind 4 (`@theme` i `globals.css`,
ingen `tailwind.config`), TypeScript 5.9 i `strict`, Motion 13, Three.js via
React Three Fiber.

---

## 1. Farge

Alle farger er tokens i `@theme`. **Skriv aldri en hex-verdi i en komponent** —
finnes ikke fargen du trenger, legg den til i `globals.css` først.

| Token | Verdi | Brukes til |
| --- | --- | --- |
| `ink-950` | `#05070a` | Sidebunn. Alt bunner her. |
| `ink-900` | `#080b11` | Seksjoner som skal løfte seg litt fra bunnen, felt-bakgrunn. |
| `ink-850` | `#0d1119` | Kortflater (`panel`, innsida av `TerminalChrome`). |
| `ink-800` | `#12171f` | Hover-flate. |
| `ink-700` | `#1b212b` | Standard kantlinje. |
| `ink-600` | `#273040` | Kant på interaktive flater (knapp, felt). |
| `ink-500` | `#3a465a` | Kant ved hover. |
| `mist-400` → `mist-100` | `#7c8796` → `#e8ebf0` | Tekst, fra svakest til sterkest. Brødtekst er `mist-300`, overskrifter arver `mist-100`. |
| `loop-a` | `#3ef0dc` | Den ene enden av sløyfa. Primærhandling på hjemmesiden, prompt-tegnet `$`, fokusring, markør. |
| `loop-b` | `#8b5cf6` | Den andre enden. Aksent og gradientmål — aldri alene på stor flate. |
| `amber-brand` | `#ffb020` | **Kun Visningsrom**: primærknapp og fokuskant i verktøydelen. Hold den ute av hjemmesiden. |

Regler:

- Lys = sløyfefargene. Alt som gløder, pulserer eller markerer «her skjer det»
  bruker `loop-a`/`loop-b`, aldri en ny farge.
- De to hjemmene har hver sin handlingsfarge: hjemmesiden `loop-a`, Visningsrom
  `amber-brand`. Ikke bland dem i samme visning.
- Tekst på farget flate er alltid `ink-950`, aldri hvit — begge aksentfargene er
  lyse.
- Status i arbeid-seksjonen er den eneste plassen semantiske farger brukes
  (`emerald` = i produksjon, `amber-brand` = under arbeid, `ink-600` = levert).
  Utvid den skalaen i `Work.tsx`, ikke med nye klasser rundt om.

## 2. Typografi

- To fonter, begge fra `next/font/google` i `layout.tsx`: **Inter** (`--font-sans`)
  til brødtekst, **JetBrains Mono** (`--font-mono`) til alt som skal lese seg som
  terminal.
- Monospace settes med utility-en `mono`, ikke med `font-mono` direkte — `mono`
  slår også på `font-feature-settings: "ss01", "cv01"`.
- Skala som allerede er i bruk:
  - `h1`: `clamp(2.4rem, 6.6vw, 4.7rem)`, `leading-[0.98]`, `tracking-[-0.035em]`
  - `h2` (via `SectionHead`): `clamp(1.7rem, 3.6vw, 2.6rem)`, `tracking-[-0.03em]`
  - `h3` i kort: `1.15rem`, `font-semibold`, `tracking-tight`
  - Ingress: `15px` / `leading-relaxed` / `mist-300`
  - Brødtekst i kort: `13.5–14.5px`
  - Mono-etiketter: `10.5–13px`, som regel `mist-400`
- Linjelengde begrenses alltid: `max-w-[60ch]` for seksjonsingresser,
  `max-w-[56ch]`–`max-w-[62ch]` for brødtekst.
- Terminalstemmen er en del av systemet: hver seksjon åpner med en kommando
  (`$ ls tjenester/`, `$ cat prosess.md`). Nye seksjoner skal ha en som er
  plausibel — ikke pynt uten mening.

## 3. Flater, kanter og radius

- `--radius-panel: 14px` er standardradien. `rounded-xl` på kort med
  terminalramme, `rounded-lg` på knapper og felt, `rounded-md` på små etiketter.
- `panel` = `ink-850` + `ink-700`-kant + panelradius. Bruk den til alt som er et
  kort i Visningsrom.
- `edge-glow` gir en 1px kant som går fra `loop-a` til `loop-b`. Den brukes
  sammen med `scanlines` i `TerminalChrome`, og bør ikke strøs utover ellers.
- `grain` ligger på `<body>` og legger fin støy over hele sida, så store mørke
  flater ikke blir bandet. Ikke legg egne støylag oppå.
- Seksjoner skilles med `border-y border-ink-800/80` og vekslende bunn
  (`ink-900/40` mot ingenting), ikke med linjer i full styrke.
- Sidebredde: hjemmesiden `max-w-[1180px]`, Visningsrom `max-w-[1600px]`, alltid
  med `px-5`. Vertikal seksjonsluft: `py-24 md:py-32`.

## 4. Komponenter — gjenbruk før du lager nytt

| Trenger du | Bruk |
| --- | --- |
| Et kort på hjemmesiden | `TerminalChrome` med `title` som en filsti eller kommando, innhold i `bg-ink-850/70 p-5…p-6`. |
| Kort som skal svare på musa | Pakk det i `Tilt` (`max={5}` for tette rutenett, `7` for store kort) og gi wrapperen `group`. |
| Overskriftsblokk i en seksjon | `SectionHead` med `command`, `title`, `lead`. |
| Tekst som skal strømme inn | `StreamText`. Skrivemaskin-effekt: `useTypewriter` / `useRotatingTypewriter` fra `Terminal.tsx`. |
| Knapp i Visningsrom | `btnPrimary` / `btnGhost` / `btnQuiet` / `btnDanger` fra `ui.tsx`. |
| Skjemafelt | `field`-utility. Den har allerede fokuskant og plassholderfarge. |
| Tomt resultat | `EmptyState`. |

Nye primitiver legges i `ui.tsx` (Visningsrom) eller som en komponent i
`components/site/` (hjemmesiden) — ikke som en engangsklasse midt i en seksjon.

## 5. Bevegelse

Bevegelse er et lag oppå, aldri en forutsetning for å forstå sida.

- Standardkurven er `[0.22, 1, 0.36, 1]` med varighet `0.45–0.7 s`. Bruk den før
  du finner på en ny.
- Inn-animasjon ved scroll: `initial={{ opacity: 0, y: 26 }}` +
  `whileInView` + `viewport={{ once: true, amount: 0.2–0.55 }}`. Aldri animasjon
  som gjentar seg hver gang noe passerer skjermen.
- Forskyvning i lister: `delay: index * 0.07` (maks tre kolonner, så `index % 3`).
- Fjærer brukes til noe som skal «lande»: `stiffness 160–380`, `damping 18–32`.
- **Hver bevegelse må ha en av-bryter.** `useReducedMotion()` i komponenten, eller
  `window.matchMedia("(prefers-reduced-motion: reduce)")` der Motion ikke er i
  bilde. Ved redusert bevegelse: åpningen hoppes over, Lenis skrus av,
  markørringen vises ikke, kort vipper ikke, sløyfa står stille,
  `loop-text-animate` og markørblinken stopper.
- Effekter som krever mus (`Tilt`, `Cursor`) sjekker i tillegg
  `(hover: hover) and (pointer: fine)` og `pointerType === "mouse"`.
- 3D skal aldri tegne i det skjulte: bruk `IntersectionObserver` og sett
  `frameloop="demand"` når scenen er ute av syne, slik `InfinityScene` gjør.
- Three.js lastes alltid med `dynamic(..., { ssr: false })`, aldri direkte.

## 6. Tilgjengelighet

- Fokusring er definert globalt: 2px `loop-a` med 2px avstand, kun ved
  `:focus-visible`. Ikke skru den av lokalt.
- Berøringsflater er minst 44px (`min-h-11`), primærknapper 48px (`min-h-12`).
- Hopp-lenka til `#innhold` ligger i `SiteNav` og skal ikke fjernes.
- Mobilmenyen eier `aria-expanded`, `aria-controls`, Escape og scroll-lås.
  Kopier det mønsteret til nye overlegg.
- Handlinger som vises ved hover får klassen `hover-reveal`, som gjør dem
  permanent synlige på berøring.
- Dekorative lag (`Cursor`, sløyfa, introen) er `aria-hidden`.
- Sida er `lang="nb"`. Skjermleser-tekst skrives på norsk.

## 7. Språk og innhold

- Norsk bokmål, hverdagslig og konkret. Ingen superlativer, ingen «løsninger som
  løfter din bedrift».
- Kommentarer i koden er norske og forklarer *hvorfor*, ikke *hva*.
- Ingen emoji i grensesnittet. Piler (`→`, `↓`) og `∞` er de eneste tegnene som
  brukes dekorativt.
- Ny tekst på hjemmesiden legges i `content.ts` og hentes derfra — også når det
  bare er ett ord.

## 8. Dette gjør vi ikke

- Hardkodede farger, radier eller fontstørrelser utenfor `globals.css`-skalaen.
  (`public/cryptopay/` er unntaket: det er produktets egne sider, kopiert inn.
  De følger CryptoPays design, ikke dette.)
- Nye avhengigheter for noe Tailwind, Motion eller Three.js allerede dekker.
- `localStorage` i noe som serveres gjennom `/serve/` — previews kjører i
  sandkasse uten `allow-same-origin`, og det vil brekke.
- `"use client"` på komponenter som ikke trenger det. Seksjoner som bare
  animerer ved scroll gjør det; rene tekstblokker gjør det ikke.
- Nye CSS-filer per komponent. Alt globalt bor i `globals.css`; alt annet er
  Tailwind-klasser.
- UI-endringer uten `npm run typecheck` etterpå.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
