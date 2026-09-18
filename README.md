# Infinity Web Creations

Hjemmesiden til gesjeften, og verktøyet som hører til. Ett Next.js-prosjekt med
to halvdeler:

- **Hjemmesiden** (`/` på norsk, `/en` på engelsk) — offentlig. En kinematisk
  åpning i 3D, en sløyfe som aldri tar slutt, og seksjoner for tjenester,
  AI-agenter til leie, arbeid, prosess og kontakt.
- **Visningsrom** (`/visningsrom`) — bak passord. Der nettsideforslag legges,
  sammenlignes side ved side og deles med kunden gjennom en hemmelig lenke.

Bygget med Next.js 16 (App Router), React 19.2, Tailwind 4, TypeScript 5.9,
Three.js via React Three Fiber (med drei og postprocessing), Motion 13 og Lenis.

---

## Kom i gang

```bash
npm install
npm run dev          # http://localhost:3000
```

Node 20.9 eller nyere. Prosjektet kjører uten konfigurasjon; opplastinger havner
i `.data/` i prosjektmappa, og du kan slette hele `.data/` når du vil starte på
nytt.

| Kommando | Hva den gjør |
| --- | --- |
| `npm run dev` | Utviklingsserver. |
| `npm run build` · `npm run start` | Produksjonsbygg og kjøring av det. |
| `npm run typecheck` | `tsc --noEmit`. Kjør denne før du pusher. |

`npm run lint` står i `package.json`, men det ligger ingen ESLint-konfigurasjon i
prosjektet ennå — typesjekken er porten som faktisk gjelder.

Under `demo/` ligger to ferdige forslag du kan dra rett inn i opplastingsfeltet:
`forslag-a.html` (én fil) og `forslag-b.zip` (mappe med CSS og SVG-logo).
Mappa `demo/forslag-b/` er kilden til den zipen — pakk den på nytt hvis du
endrer noe der.

`CLAUDE.md` i rota er regelsettet for videre utvikling: fargetokens, typografi,
komponentene som skal gjenbrukes, bevegelse og tilgjengelighet. Les den før du
skriver UI-kode her.

## Hjemmesiden

| Fil | Hva den gjør |
| --- | --- |
| `src/lib/site/content/nb.ts` · `en.ts` | **All tekst på siden, på hvert sitt språk.** Tjenester, agenter, prosjekter, prosess, meny, skjema og linjene i åpningen. `types.ts` er formen begge må fylle – mangler et felt i den ene, stopper typesjekken. `shared.ts` har det som er likt (kontaktopplysninger, lenker, status, skisser). Endre her, ikke i komponentene. |
| `src/components/site/HomePage.tsx` | Hele forsida, samme for begge språk. `SiteContext.tsx` gir komponentene innholdet (`useSite()`). |
| `src/components/site/LanguageGate.tsx` | Språkvalget ved første besøk. Forhåndsvalgt fra nettleserspråket, huskes i cookien `iwc_lang`, holder åpningen tilbake til valget er gjort. Vises aldri igjen; bytte skjer i menyen. |
| `src/components/site/Agents.tsx` | AI-agenter til leie. Hvert kort er en terminal som «haler» loggen til én agent, linje for linje når kortet rulles inn. Loggene er eksempler og merket som det. |
| `src/app/globals.css` | Fargeskalaene (`ink-*`, `mist-*`) og de to endene av sløyfa (`--color-loop-a`, `--color-loop-b`). Alt som lyser bruker disse to. |
| `src/components/site/IntroGate.tsx` | Laster åpningen bare i nettleseren, slik at three.js og bloom aldri havner i hoved-bunten eller i server-renderingen. Viser en blinkende markør til den er lastet, så de første sekundene aldri er svarte. Et lite skript i `RootShell.tsx` (fra `src/lib/site/intro.ts`) skjuler markøren for den som alt har sett åpningen. |
| `src/components/site/CinematicIntro.tsx` | **Åpningen.** Et mørkt rom, en skikkelse med hetta mot oss, og en skjerm som lyser opp ryggen hans. Kameraet kjører over skulderen, forbi hetta og inn i skjermen på 6,4 sekunder – klokka starter først når scenen har tegnet sitt første bilde. Terminalen skriver, lister opp, rydder skjermen og lar navnet stå alene; det er det kameraet stuper inn i. Kjører én gang per fane (`sessionStorage`-nøkkel `iwc:intro`), hoppes over med tast, klikk eller scroll, og vises ikke i det hele tatt ved «reduser bevegelse» eller uten WebGL. |
| `src/components/site/ScreenTexture.ts` | Terminalen inne i åpningen. Tegnes på et 2D-lerret og legges som tekstur på skjermflaten, så den ligger i selve 3D-scenen — hetta kan skygge for den, og bloom får den til å lyse. |
| `src/components/site/InfinityScene.tsx` | 3D-sløyfa i heroen. Et rør langs en lemniskat med to lyspulser som løper hver sin vei og aldri når slutten. Vipper mot musepekeren, slutter å tegne når den er utenfor skjermen, og faller tilbake til en SVG-sløyfe uten WebGL. |
| `src/components/site/Hero.tsx` | Førsteinntrykket: prompt, overskrift, roterende skrivemaskin-linje, og parallakse mellom sløyfa og teksten. |
| `src/components/site/Services.tsx` · `Work.tsx` · `Process.tsx` · `Contact.tsx` | Seksjonene. `Process` tegner tidslinja i takt med scrollen; `Contact` er skjemaet. |
| `src/components/site/SiteNav.tsx` · `SiteFooter.tsx` | Toppmeny med mobilmeny og hopp-lenke, og bunnlinja. |
| `src/components/site/SitePreview.tsx` | Sidene selv i arbeid-kortene: en iframe tegnet i 1280 px bredde og skalert ned til kortet, lastet først når kortet nærmer seg skjermen, med et lag oppå som hindrer at ramma stjeler scroll og klikk. `preview.src` per prosjekt i `content/shared.ts`. |
| `src/components/site/Wireframe.tsx` | Skissen som vises i stedet når sida ikke kan settes i ramme (`preview.framable: false`). Radene settes per prosjekt i `content/shared.ts`. |
| `src/components/site/Terminal.tsx` · `StreamText.tsx` | Tekst som skrives ut: skrivemaskin-hooks og terminalramma rundt kortene, og tekst som strømmer inn ord for ord. |
| `src/components/site/Tilt.tsx` · `Cursor.tsx` · `SmoothScroll.tsx` | Bevegelseslaget: kort som vipper i 3D mot musa, ringen som følger pekeren, og myk scrolling med Lenis. |
| `src/components/site/SectionHead.tsx` | Kommandolinje, overskrift og ingress øverst i hver seksjon. |
| `src/components/site/SupportChat.tsx` | Support-chatten: knapp nede til høyre og et terminalvindu som svares av en AI-agent. |

**To språk, to adresser.** Norsk bor på `/`, engelsk på `/en`, med `hreflang`
begge veier. Fordi `<html lang>` bare kan settes av en rot-layout, er appen delt
i to route-grupper: `app/(no)/` (norsk forside *og* hele verktøydelen) og
`app/(en)/en/` (engelsk forside). Begge bruker `RootShell.tsx`. Å bytte språk er
en full sidelast, og bryteren i menyen skriver cookien før den navigerer.
`src/proxy.ts` sender den som har valgt engelsk fra `/` til `/en` – bare fra
rota, så en delt lenke alltid åpner på språket den peker til.

**Rammene i arbeid-seksjonen** viser sidene som de er. CryptoPay er
`/cryptopay` rett fram. De to andre går gjennom *utstillingen*: en deling i
Visningsrom med den faste sluggen `utstilling`, som inneholder en kopi av
Stenumgaard-sidas filer. `stenumgaarddesign.no` sender `X-Frame-Options:
SAMEORIGIN` og kan ikke settes i ramme direkte, men en kopi servert fra
`/serve/` er samme origin. Stenumgaard-kortet peker på `/vis/utstilling`, som
sender videre til den første pakken i delingen; Visningsrom-kortet peker på
kundelenka `/s/utstilling`. Se **Utstillingen** under.

**Teksten kan endres uten kode.** `/visningsrom/tekst` (bak passord) viser
hvert tekstfelt på hjemmesiden, per språk, med standardteksten fra koden som
plassholder. Det admin skriver lagres som overstyring (`site/text.<språk>.json`
i lageret) og legges oppå standardteksten når sida rendres
(`src/lib/site/load.ts` → `overrides.ts`). Tomt felt = standardtekst; bare
endrede felt lagres, så ny standardtekst i koden slår gjennom overalt der
ingen har skrevet noe eget. Lagring bygger forsida på nytt med én gang
(`revalidatePath`). Stier, lenker, status og skisser kan ikke endres der – de
er struktur, ikke tekst.

**Support-chatten** nede til høyre svares av en AI-agent
(`src/lib/support.ts` + `/api/support`). Agenten får en systemprompt bygget
fra innholdet på sida – tjenester, agenter, prosess, kontakt, med admins
tekstendringer – på det språket den besøkende har valgt, og er instruert til
bare å svare ut fra det, aldri oppgi priser som ikke står der, og sende folk
til e-post for tilbud og avtaler. Hvordan den presenterer seg (`support.persona`)
og alle tekstene i vinduet kan endres fra `/visningsrom/tekst`. Samtalen lever
i besøkendes fane (`sessionStorage`) og sendes med i hver forespørsel;
serveren lagrer ingenting. Svaret strømmes inn ord for ord. Bremset til 20
meldinger per IP og 400 totalt per ti minutter.

Tre leverandører, valgt i `.env.local` (den første som er satt opp brukes,
eller `SUPPORT_PROVIDER` tvinger):

| Leverandør | Variabler | Kostnad |
| --- | --- | --- |
| **Cloudflare Workers AI** (standard) | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_TOKEN` | Gratis kvote: 10 000 «neurons» per dag ≈ 140 svar med `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, ≈ 200 med `llama-3.1-8b`. Over det: øre-beløp. |
| OpenAI-kompatibelt endepunkt | `SUPPORT_BASE_URL`, `SUPPORT_API_KEY` | Ollama på serveren er gratis (tregt uten GPU); Groq/OpenRouter etter deres vilkår. |
| Anthropic (Claude) | `ANTHROPIC_API_KEY` | Per token, ~0,005 $ per svar med `claude-sonnet-5`. |

`SUPPORT_MODEL` overstyrer leverandørens standardmodell. Uten noen leverandør
viser chatten en beskjed om å sende e-post; `ANTHROPIC_API_KEY=mock` gir et
fast testsvar lokalt. Cloudflare: konto-ID står i dashbordet under Workers &
Pages → Overview; token lages under My Profile → API Tokens med malen
«Workers AI».

**Bevegelse er et lag, ikke en forutsetning.** Alt over sjekker
`prefers-reduced-motion`: åpningen hoppes over, Lenis skrus av, ringen rundt
pekeren vises ikke, kortene slutter å vippe og sløyfa står stille. Vipp og ring
krever dessuten fin peker, så på berøring er kortene vanlige kort. Uten WebGL
byttes begge 3D-scenene ut med flate alternativ.

**Før lansering:** fyll inn `phone` og `orgNumber` i
`src/lib/site/content/shared.ts`, bytt `email` hvis henvendelser skal et annet
sted, og sett `agents.price` i både `nb.ts` og `en.ts`. Feltene er merket TODO.
Telefon vises bare i kontaktseksjonen når den er satt, org.nr bare i bunnlinja,
og prislinja bare når prisen er satt.

Kontaktskjemaet setter sammen en e-post og åpner den i besøkendes eget
e-postprogram. Ingen skjematjeneste, ingen database, ingen sporingscookies.

## Visningsrom

### Visningene

| Rute | Hva den gjør |
| --- | --- |
| `/visningsrom` | Galleriet. Opplasting, levende miniatyrer, søk, og valg av flere previews. |
| `/visningsrom/preview/<id>` | Én preview i full bredde, med enhetsvelger og detaljer. |
| `/visningsrom/compare?ids=a,b` | To til fire paneler side ved side, felles enhetsbredde og synkronisert scrolling. |
| `/visningsrom/shares` | Oversikt over delte lenker, med mulighet til å trekke dem tilbake. |
| `/visningsrom/tekst` | Rediger teksten på hjemmesiden, norsk og engelsk. |
| `/s/<token>` | Kundemodus. Ingen opplasting eller sletting – bare forslagene og et kommentarfelt. Åpen uten passord. |
| `/vis/<slug>` | Sida selv i en deling med valgt slug – videresending til `/serve/<id>/`. Brukes av hjemmesiden. |

Marker previews i galleriet med avkryssingsboksen øverst til venstre på kortet,
og velg **Sammenlign side ved side** eller **Del med kunde** i linja som kommer
opp nederst.

### Utstillingen

Arbeid-seksjonen på hjemmesiden henter det den viser fra en deling med slug
`utstilling`. Den lages på serveren der både appen og nettsidefilene ligger:

```bash
node scripts/utstilling.mjs --find stenumgaard --title "Stenumgaard Design" --slug utstilling
```

`--find <navn>` leter i mappa ved siden av prosjektet (`../`) etter en mappe
med navnet i seg og bruker byggemappa der (`dist/`, `out/`, `build/`,
`public/` eller rota – der `index.html` ligger). `--dir <mappe>` peker rett på
en mappe; begge kan gjentas for flere pakker (`--title` per pakke,
`--app http://localhost:3000` om appen kjører et annet sted). Skriptet sier
fra hvis `index.html` bruker absolutte stier. Det zipper hver mappe, laster den opp gjennom `/api/previews`, sletter en
eventuell gammel deling med samme slug, og lager en ny gjennom `/api/shares`.
Passordet leses fra `ADMIN_PASSWORD` i miljøet eller `.env.local`. Kjør det på
nytt for å bytte innhold – hjemmesiden trenger ingen kodeendring, fordi den
peker på sluggen, ikke på preview-id-er:

| Adresse | Hva |
| --- | --- |
| `/s/utstilling` | Kundelenka: alle pakkene i delingen, slik en kunde ser dem. Åpen. |
| `/vis/utstilling` | Sida selv: sender videre til `/serve/<id>/` for første pakke. `?n=1` for neste. |

Slugs er et bevisst unntak fra hemmelige tokens: `POST /api/shares` godtar
`slug` (6–40 tegn, små bokstaver, tall, bindestrek) og svarer 409 hvis den er
i bruk. En deling med slug er offentlig – det er hele poenget med den.

Én ting å vite om kopien: filene serveres fra `/serve/<id>/`, så sida må bruke
relative stier. En Vite-build med `base: './'` eller en Next-eksport med
`assetPrefix: './'` fungerer; absolutte stier som `/assets/x.js` peker feil.

### To veier inn for filer

Appen velger opplastingsmetode selv, ut fra hvilken lagring som er aktiv:

- **Gjennom serveren** (lokalt og på egen server). Fila sendes som `multipart`
  til `/api/previews`, som pakker ut og lagrer den. Enkelt, men på Vercel stopper
  requests over ca. 4,5 MB.
- **Rett fra nettleseren** (når Vercel Blob er koblet til). Nettleseren henter et
  kortlivet token fra `/api/previews/client-token`, laster fila opp direkte til
  blob-lageret – med `multipart` og gjenforsøk per del for filer over 8 MB – og
  ber deretter `/api/previews/finalize` om å pakke den ut. Selve fila passerer
  aldri serverless-funksjonen, så 4,5 MB-grensen gjelder ikke, og `MAX_UPLOAD_MB`
  er det eneste taket. Framdriften vises per fil i opplastingsfeltet.

Token-ruta ligger bak passordet, og signerer bare stier på formen
`uploads/<tilfeldig>/<filnavn>.(html|htm|zip)` (`src/lib/uploadPath.ts` er
regelen, delt mellom nettleser og server). `finalize` godtar bare de samme
stiene, leser fila, pakker den ut og sletter den midlertidige mappa etterpå –
også når utpakkingen feiler. Det er bevisst ikke satt opp noe
`onUploadCompleted`-kall, så ruta nås aldri utenfra.

### Hva som kan lastes opp

- **`.html`** – én enkelt fil. Alt må ligge i fila (inline CSS/JS, eller
  ressurser hentet fra et CDN).
- **`.zip`** – en hel mappe. Visningsrom pakker ut, fjerner en eventuell felles
  toppmappe, og finner rot-dokumentet selv (`index.html` i rota, ellers den
  grunneste HTML-fila). Relative stier som `./css/style.css` fungerer.
- **Adresse** – en `http(s)://`-URL som vises i iframe. Merk at mange nettsteder
  setter `X-Frame-Options` og da vises de tomme; de må åpnes i egen fane.

Kjørbare filtyper (`.exe`, `.sh`, `.jar` …) pakkes aldri ut fra en ZIP.

## CryptoPay-demoen

`/cryptopay` viser fram CryptoPay Core – Bitcoin-betaling og 2-av-3-escrow –
som et klikkbart utstillingsvindu. Sidene er produktets egne (`index`,
`dashboard`, `checkout`, `pgp`, `glossary`), kopiert inn i `public/cryptopay/`
med tre tilpasninger: en demo-stripe øverst, mørkt tema som standard, og at
API-adressen peker til `/cryptopay` i stedet for en ekte server.

Bak dem ligger `src/app/cryptopay/v1/[...path]/route.ts` og
`src/lib/cryptopayDemo.ts`: et stand-in-API med samme stier og svar som det
ekte (`/v1/prices`, `/v1/invoices`, `/v1/escrows`, `/v1/pgp/*`), men uten
Bitcoin-node, database eller signatursjekk. Fakturaer og escrow går gjennom
tilstandene sine på klokka – en ny on-chain-faktura er `DETECTED` etter ti
sekunder og `CONFIRMED` etter tjuefem – så den som prøver får se hele løpet.
Fem fakturaer og tre escrow ligger der fast som eksempler.

**PGP-innloggingen er ekte.** Nøkkelen leses med `openpgp`, hemmeligheten
krypteres til den, og svaret sammenlignes i konstant tid, akkurat som i
produktet. En pastet privatnøkkel avvises. Det er den delen av produktet som er
verdt å vise, så den er ikke juks.

Alt annet lever i minnet. På Vercel betyr det at noe du lager kan være borte på
neste kaldstart; eksemplene er alltid der. Dashbordet har API-nøkkel ferdig
utfylt – trykk **Connect**. `/cryptopay` uten filnavn sendes videre til
`index.html` (redirect, ikke rewrite, fordi sidene bruker relative stier).
`/cryptopay/openapi.json` er produktets OpenAPI-beskrivelse, generert fra
`cryptopay-core/src/api/openapi.ts`.

Skal demoen oppdateres fra produktet: kopier `web/` på nytt og gjør de samme
tre tilpasningene. Det er ingen byggesteg – med vilje.

## Sikkerhet

Appen serverer HTML andre har laget, så det er verdt å vite hvordan det er
skjermet:

- Opplastede sider serveres fra `/serve/<id>/…` med CSP-direktivet `sandbox`, og
  bygges inn i en `<iframe sandbox>` **uten** `allow-same-origin`. De kjører
  dermed i en ugjennomsiktig origin og kan verken lese cookies, `localStorage`
  eller kalle API-ene med din innloggede økt.
- Eksterne adresser ligger allerede på et annet domene, og får `allow-same-origin`
  – uten den ville de fleste nettsteder brekke.
- Stier valideres mot katalogtraversering både ved utpakking og ved servering.
- `/cryptopay/v1/*` er åpent, men leser og skriver bare i sitt eget minne. Det
  rører verken previews, delinger eller kommentarer.
- Resten av appen sendes med `X-Content-Type-Options` og `Referrer-Policy` fra
  `next.config.ts`. `/serve` er bevisst utenfor den regelen og har sine egne
  headere.
- Sett `PREVIEW_STRICT_SANDBOX=false` hvis en mal trenger `localStorage` for å
  vises riktig. Da mister du beskyttelsen over.

### Passord

Passordsjekken ligger i `src/proxy.ts` og gjelder `/visningsrom` og
admin-API-ene. Innlogging er bremset i `src/lib/rateLimit.ts`: hvert feilforsøk
svarer tregere enn det forrige (0 → 2 s), etter fem feil er IP-en sperret i 30
sekunder, og sperra dobles for hvert nye forsøk opp til en halvtime. Tellerne
lever i minnet til instansen, så på Vercel nullstilles de ved kaldstart – det er
en bremse mot ordboksangrep, ikke en garanti. Skal den bli hard, må tellerne
flyttes til lageret i `src/lib/storage/`.

Uten `ADMIN_PASSWORD` er admin-delen åpen. Det er greit lokalt, men sett den før
du legger appen ut:

```bash
ADMIN_PASSWORD=et-langt-passord npm run start
```

Hjemmesiden er alltid offentlig, og kundelenkene (`/s/<token>`) er alltid åpne uten passord – tokenet er hemmeligheten.
Trekk en lenke tilbake fra `/visningsrom/shares` når forslaget er avgjort.

## Miljøvariabler

Se `.env.example`. Kort oppsummert:

| Variabel | Standard | Hva den gjør |
| --- | --- | --- |
| `ADMIN_PASSWORD` | tom | Passord for admin-delen. Tom = åpen. |
| `MAX_UPLOAD_MB` | `25` | Maks filstørrelse per opplasting. |
| `BLOB_READ_WRITE_TOKEN` | tom | Settes av Vercel Blob. Aktiverer blob-lagring. |
| `STORAGE_DRIVER` | auto | Tving `fs` eller `blob`. |
| `STORAGE_DIR` | `.data` | Mappe for lokal lagring. |
| `PREVIEW_STRICT_SANDBOX` | `true` | CSP-sandbox på serverte preview-filer. |
| `CLOUDFLARE_ACCOUNT_ID` · `CLOUDFLARE_AI_TOKEN` | tom | Support-chat via Workers AI (gratis kvote). |
| `SUPPORT_BASE_URL` · `SUPPORT_API_KEY` | tom | Support-chat via OpenAI-kompatibelt endepunkt. |
| `ANTHROPIC_API_KEY` | tom | Support-chat via Claude. `mock` = fast testsvar. |
| `SUPPORT_MODEL` · `SUPPORT_PROVIDER` | auto | Modell og tvungen leverandør for chatten. |

## Deploy

### Vercel

Filsystemet er skrivebeskyttet på Vercel, så lagringen må flyttes til Blob:

1. Push prosjektet til Git og importer det i Vercel.
2. **Storage → Blob → Connect Store**. Da settes `BLOB_READ_WRITE_TOKEN`
   automatisk, og appen bytter til blob-lagring uten flere endringer.
3. Sett `ADMIN_PASSWORD` under **Settings → Environment Variables**.

Så snart Blob er koblet til, bytter opplastingen automatisk til direkte
klientopplasting (se **To veier inn for filer**), og store ZIP-pakker er ikke
lenger begrenset av serverless-grensen. Vil du ta imot virkelig store pakker,
er det bare `MAX_UPLOAD_MB` som må opp.

### Egen server eller Docker

```bash
npm run build
ADMIN_PASSWORD=… npm run start
```

Da brukes filsystemet, og `.data/` er alt som må sikkerhetskopieres. Monter den
som et volum i Docker.

## Hvordan det henger sammen

```
src/
  app/
    globals.css                  fargeskalaene og utilities
    (no)/                        norsk rot-layout (lang="nb")
      page.tsx                   hjemmesiden på norsk
      login/                     innlogging til admin-delen
      visningsrom/               galleri, enkeltvisning, sammenligning, delte lenker
      s/[token]/page.tsx         kundemodus
      serve/[id]/[[...path]]/    sandboxet servering av opplastede filer
      vis/[slug]/                utstillingen: slug → /serve/<id>/
      cryptopay/                 stand-in-API for CryptoPay-demoen
      api/previews/              multipart-opplasting, client-token, finalize
      api/                       deling, kommentarer, innlogging, tekst på sida, support-chat
    (en)/en/                     engelsk rot-layout (lang="en") og hjemmesiden på engelsk
  components/site/               hjemmesiden - åpning, språkvalg, hero, seksjoner, bevegelse
  components/                    Visningsrom
  lib/
    site/content/                nb.ts, en.ts, shared.ts, types.ts - all tekst på hjemmesiden
    site/lang.ts                 språkcookien
    site/overrides.ts            admins tekstendringer: flate stier oppå innholdet
    site/load.ts                 innhold + overstyringer, det sida faktisk viser
    storage/                     fs- og blob-driver bak ett grensesnitt
    store.ts                     previews, delinger og kommentarer
    uploads.ts                   felles opprettelse av previews (begge veier inn)
    uploadPath.ts                stiregler delt mellom nettleser og server
    zip.ts                       utpakking og valg av rot-dokument
    inject.ts                    broen som gir synkronisert scrolling
    cryptopayDemo.ts             tilstand og regler for CryptoPay-demoen
    support.ts                   support-chatten: systemprompt fra innholdet, strømming, brems
  proxy.ts                       passordsjekken
public/cryptopay/                CryptoPay-sidene, kopiert fra produktet
scripts/utstilling.mjs           legger en mappe inn i Visningsrom som utstillingen
```

Metadata lagres som én JSON-fil per objekt (`previews/<id>/meta.json`,
`shares/<token>.json`), ikke som ett felles register. Det gjør at to samtidige
opplastinger ikke kan skrive over hverandre – også når appen kjører serverless.
Skal dette vokse til noe med brukere og roller, er `src/lib/store.ts` stedet å
bytte JSON-filene mot Postgres.
