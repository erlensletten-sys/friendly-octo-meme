# Infinity Web Creations

Hjemmesiden til gesjeften, og verktøyet som hører til. Ett Next.js-prosjekt med
to halvdeler:

- **Hjemmesiden** (`/`) — offentlig. En kinematisk åpning i 3D, en sløyfe som
  aldri tar slutt, og seksjoner for tjenester, arbeid, prosess og kontakt.
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
| `src/lib/site/content.ts` | **All tekst på siden.** Navn, kontaktopplysninger, tjenester, prosjekter, prosess, meny og linjene i åpningssekvensen. Endre her, ikke i komponentene. |
| `src/app/globals.css` | Fargeskalaene (`ink-*`, `mist-*`) og de to endene av sløyfa (`--color-loop-a`, `--color-loop-b`). Alt som lyser bruker disse to. |
| `src/components/site/IntroGate.tsx` | Laster åpningen bare i nettleseren, slik at three.js og bloom aldri havner i hoved-bunten eller i server-renderingen. |
| `src/components/site/CinematicIntro.tsx` | **Åpningen.** Et mørkt rom, en skikkelse med hetta mot oss, og en skjerm som lyser opp ryggen hans. Kameraet kjører over skulderen og inn i skjermen på 6,4 sekunder. Kjører én gang per fane (`sessionStorage`-nøkkel `iwc:intro`), hoppes over med tast, klikk eller scroll, og vises ikke i det hele tatt ved «reduser bevegelse» eller uten WebGL. |
| `src/components/site/ScreenTexture.ts` | Terminalen inne i åpningen. Tegnes på et 2D-lerret og legges som tekstur på skjermflaten, så den ligger i selve 3D-scenen — hetta kan skygge for den, og bloom får den til å lyse. |
| `src/components/site/InfinityScene.tsx` | 3D-sløyfa i heroen. Et rør langs en lemniskat med to lyspulser som løper hver sin vei og aldri når slutten. Vipper mot musepekeren, slutter å tegne når den er utenfor skjermen, og faller tilbake til en SVG-sløyfe uten WebGL. |
| `src/components/site/Hero.tsx` | Førsteinntrykket: prompt, overskrift, roterende skrivemaskin-linje, og parallakse mellom sløyfa og teksten. |
| `src/components/site/Services.tsx` · `Work.tsx` · `Process.tsx` · `Contact.tsx` | Seksjonene. `Process` tegner tidslinja i takt med scrollen; `Contact` er skjemaet. |
| `src/components/site/SiteNav.tsx` · `SiteFooter.tsx` | Toppmeny med mobilmeny og hopp-lenke, og bunnlinja. |
| `src/components/site/Wireframe.tsx` | Skissene i arbeid-seksjonen — strukturen på hver side, tegnet i stedet for et skjermbilde. Radene settes per prosjekt i `content.ts`. |
| `src/components/site/Terminal.tsx` · `StreamText.tsx` | Tekst som skrives ut: skrivemaskin-hooks og terminalramma rundt kortene, og tekst som strømmer inn ord for ord. |
| `src/components/site/Tilt.tsx` · `Cursor.tsx` · `SmoothScroll.tsx` | Bevegelseslaget: kort som vipper i 3D mot musa, ringen som følger pekeren, og myk scrolling med Lenis. |
| `src/components/site/SectionHead.tsx` | Kommandolinje, overskrift og ingress øverst i hver seksjon. |

**Bevegelse er et lag, ikke en forutsetning.** Alt over sjekker
`prefers-reduced-motion`: åpningen hoppes over, Lenis skrus av, ringen rundt
pekeren vises ikke, kortene slutter å vippe og sløyfa står stille. Vipp og ring
krever dessuten fin peker, så på berøring er kortene vanlige kort. Uten WebGL
byttes begge 3D-scenene ut med flate alternativ.

**Før lansering:** fyll inn `phone` og `orgNumber` i `src/lib/site/content.ts`,
og bytt `email` hvis henvendelser skal et annet sted. Feltene er merket TODO.
Telefon vises bare i kontaktseksjonen når den er satt, og org.nr bare i bunnlinja.

Kontaktskjemaet setter sammen en e-post og åpner den i besøkendes eget
e-postprogram. Ingen skjematjeneste, ingen database, ingen sporingscookies.

## Visningsrom

### De fem visningene

| Rute | Hva den gjør |
| --- | --- |
| `/visningsrom` | Galleriet. Opplasting, levende miniatyrer, søk, og valg av flere previews. |
| `/visningsrom/preview/<id>` | Én preview i full bredde, med enhetsvelger og detaljer. |
| `/visningsrom/compare?ids=a,b` | To til fire paneler side ved side, felles enhetsbredde og synkronisert scrolling. |
| `/visningsrom/shares` | Oversikt over delte lenker, med mulighet til å trekke dem tilbake. |
| `/s/<token>` | Kundemodus. Ingen opplasting eller sletting – bare forslagene og et kommentarfelt. Åpen uten passord. |

Marker previews i galleriet med avkryssingsboksen øverst til venstre på kortet,
og velg **Sammenlign side ved side** eller **Del med kunde** i linja som kommer
opp nederst.

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
    page.tsx                     hjemmesiden
    layout.tsx · globals.css     fonter, metadata og fargeskalaene
    login/                       innlogging til admin-delen
    visningsrom/                 galleri, enkeltvisning, sammenligning, delte lenker
    s/[token]/page.tsx           kundemodus
    serve/[id]/[[...path]]/      sandboxet servering av opplastede filer
    api/previews/                multipart-opplasting, client-token, finalize
    api/                         deling, kommentarer, innlogging
  components/site/               hjemmesiden - åpning, hero, seksjoner, bevegelse
  components/                    Visningsrom
  lib/
    site/content.ts              all tekst på hjemmesiden
    storage/                     fs- og blob-driver bak ett grensesnitt
    store.ts                     previews, delinger og kommentarer
    uploads.ts                   felles opprettelse av previews (begge veier inn)
    uploadPath.ts                stiregler delt mellom nettleser og server
    zip.ts                       utpakking og valg av rot-dokument
    inject.ts                    broen som gir synkronisert scrolling
  proxy.ts                       passordsjekken
```

Metadata lagres som én JSON-fil per objekt (`previews/<id>/meta.json`,
`shares/<token>.json`), ikke som ett felles register. Det gjør at to samtidige
opplastinger ikke kan skrive over hverandre – også når appen kjører serverless.
Skal dette vokse til noe med brukere og roller, er `src/lib/store.ts` stedet å
bytte JSON-filene mot Postgres.
