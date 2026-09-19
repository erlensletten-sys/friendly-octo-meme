import { brandShared, navHrefs, projects } from "./shared";
import type { Content } from "./types";

/**
 * Norsk - originalen. Endre tekst her, ikke i komponentene. en.ts følger
 * samme form; legger du til et felt her, sier TypeScript fra der.
 */

const services: Content["services"]["items"] = [
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

const agents: Content["agents"]["items"] = [
  {
    id: "henvendelser",
    command: "tail -f agenter/henvendelser.log",
    title: "Henvendelses-agent",
    body:
      "Svarer på e-post og skjema innen minutter, døgnet rundt. Stiller de spørsmålene du ville stilt, foreslår befaring i kalenderen din, og legger alt klart i innboksen – du bestemmer.",
    log: [
      { who: "kunde", text: "Hei, kan dere støpe gulv i en garasje på ca 120 m² i oktober?" },
      { who: "agent", text: "Ja, det tar vi. Er det på eksisterende såle, eller skal vi ta grunnarbeidet også?" },
      { who: "kunde", text: "Eksisterende såle. Vinstra." },
      { who: "system", text: "befaring foreslått tir 7. okt 10:00 · lagt i innboks for godkjenning" },
    ],
    bullets: ["E-post, skjema, SMS", "Din tone, dine regler", "Ingenting sendes uten ditt ja"],
  },
  {
    id: "tilbud",
    command: "tail -f agenter/tilbud.log",
    title: "Tilbuds-agent",
    body:
      "Tar befaringsnotatene dine – tekst, bilder, tall på telefonen – og skriver tilbudsutkastet etter dine egne maler og priser. Du leser gjennom og sender.",
    log: [
      { who: "system", text: "3 bilder + 2 min taleopptak mottatt fra befaring #214" },
      { who: "agent", text: "Utkast klart: 118 m² gulvstøp, armering, glatting. Ett usikkert punkt: fall mot sluk – merket gult." },
      { who: "system", text: "tilbud-214.pdf lagt i Tilbud/Utkast" },
    ],
    bullets: ["Dine maler og priser", "Merker det den er usikker på", "Utkast, aldri sendt av seg selv"],
  },
  {
    id: "drift",
    command: "tail -f agenter/drift.log",
    title: "Drifts-agent",
    body:
      "Passer på nettsiden og verktøyene. Ser at skjemaet fortsatt sender, at siden er rask, at sertifikater fornyes – og forteller deg bare når noe faktisk krever deg.",
    log: [
      { who: "system", text: "04:12 kontaktskjema testet · ok · 1,3 s" },
      { who: "system", text: "04:12 sertifikat fornyes om 61 dager · ok" },
      { who: "agent", text: "Ingenting å gjøre i natt. Neste rapport mandag 08:00." },
    ],
    bullets: ["Sjekker hver natt", "Ukentlig rapport i klartekst", "Varsler bare når det haster"],
  },
  {
    id: "innhold",
    command: "tail -f agenter/innhold.log",
    title: "Innholds-agent",
    body:
      "Holder nettsiden levende. Lager utkast til nye prosjektsider fra bildene og et par setninger fra deg, og foreslår oppdateringer når noe på siden har blitt utdatert.",
    log: [
      { who: "kunde", text: "Ferdig med hallen på Kvam i dag, 6 bilder vedlagt." },
      { who: "agent", text: "Utkast til prosjektside laget: «Industrihall, Kvam – 640 m² fiberarmert gulv». Vil du ha med byggherre?" },
      { who: "system", text: "utkast lagret i CMS · ikke publisert" },
    ],
    bullets: ["Utkast rett i CMS-et", "Bruker dine ord, ikke reklamespråk", "Du publiserer"],
  },
];

const work = projects([
  {
        id: "stenumgaard",
        name: "Stenumgaard Design",
        sector: "3D-printing",
        summary:
          "Nettsted med produktvisning i 3D rett i nettleseren, slik at kunden kan snu på modellen før de bestiller.",
      },
  {
        id: "visningsrom",
        name: "Visningsrom",
        sector: "Eget verktøy",
        summary:
          "Der jeg legger nettsideforslag så kunden kan se dem side ved side i desktop-, nettbrett- og mobilbredde og svare rett under. Ligger bak innlogging på denne siden.",
      },
  {
        id: "cryptopay",
        name: "CryptoPay",
        sector: "Bitcoin-betaling og escrow · eget",
        summary:
          "Betalingsløsning der pengene går rett til mottakerens lommebok — on-chain og Lightning, med 2-av-3-escrow og innlogging med PGP-nøkkel i stedet for passord. Demoen kjører mot et oppdiktet API.",
      },
]);

export const nb: Content = {
  locale: "nb",
  brand: {
    ...brandShared,
    tagline: "Fullstack utvikling for bedrifter som skal bli funnet og kontaktet",
    location: "Vinstra, Gudbrandsdalen",
  },
  heroRotation: [
    "nettsider som laster på under ett sekund",
    "CMS eieren faktisk klarer å bruke",
    "AI-agenter som svarer kundene dine",
    "integrasjoner mot systemene dere alt har",
    "verktøy bygget for én arbeidsdag om gangen",
  ],
  hero: {
    whoami: "Erlen Sletten — fullstack utvikler, ",
    title: ["Nettsider og verktøy", "som holder", "å drive bedrift med"],
    buildsPrefix: "bygger ",
    lead: "Jeg bygger for små og mellomstore bedrifter, mest innen bygg og anlegg. Alt jeg leverer skal kunne driftes videre uten meg — og forbedres videre med meg.",
    ctaWork: "Se arbeidet",
    ctaContact: "Ta kontakt",
    available: "ledig for oppdrag",
    scroll: "scroll",
  },
  intro: { skip: "trykk hvor som helst for å hoppe over" },
  nav: [
    { href: navHrefs[0], label: "Tjenester" },
    { href: navHrefs[1], label: "Agenter" },
    { href: navHrefs[2], label: "Arbeid" },
    { href: navHrefs[3], label: "Prosess" },
    { href: navHrefs[4], label: "Kontakt" },
  ],
  ui: {
    skipToContent: "Hopp til innhold",
    visningsrom: "Visningsrom",
    contact: "Kontakt",
    openMenu: "Åpne meny",
    closeMenu: "Lukk meny",
    mainMenu: "Hovedmeny",
    mobileMenu: "Mobilmeny",
    open: "åpne →",
    switchLanguage: "Switch to English",
  },
  services: {
    command: "ls tjenester/",
    title: "Fire ting jeg gjør, og gjør ordentlig",
    lead: "Jeg tar heller fire oppdrag i året som blir riktige enn tjue som blir omtrent. Under ligger det jeg faktisk leverer.",
    items: services,
  },
  agents: {
    command: "ps aux | grep agent",
    title: "AI-agenter til leie",
    lead: "Små, avgrensede assistenter som tar én jobb i bedriften din og gjør den hver dag. De jobber i dine systemer, i din tone, og de sender aldri noe uten at du har sagt ja. Du leier dem månedsvis; jeg setter dem opp og passer på dem.",
    items: agents,
    howTitle: "Slik leies de",
    how: [
      {
        title: "Én agent, én jobb",
        body: "Vi velger den jobben som stjeler mest tid, og setter opp én agent for den. Ikke ti på én gang.",
      },
      {
        title: "To uker på prøve",
        body: "Agenten kjører ved siden av deg, og du ser hvert forslag før det går ut. Passer den ikke, koster det ingenting.",
      },
      {
        title: "Månedsleie, oppsigelig",
        body: "Fast pris per agent per måned, inkludert justeringer og tilsyn. Si opp når du vil; dataene er dine.",
      },
    ],
    priceLabel: "pris",
    // TODO: sett ekte pris, f.eks. "fra kr 2 900 /mnd per agent". Tom = skjult.
    price: "",
    priceNote: "Oppsett kommer i tillegg, og prises etter hva agenten skal kobles til.",
    cta: "Spør om en agent",
    exampleNote: "Loggene er eksempler på hvordan agentene jobber, ikke ekte henvendelser.",
    speaker: { kunde: "kunde", agent: "agent", system: "system" },
  },
  work: {
    command: "git log --oneline arbeid/",
    title: "Det jeg har bygget",
    lead: "Tre ting du kan se på rett her. Rammene under er sidene selv, ikke skjermbilder – åpne dem i egen fane for å prøve.",
    status: { live: "i produksjon", wip: "under arbeid", delivered: "levert" },
    items: work,
  },
  process: {
    command: "cat prosess.md",
    title: "Slik går et oppdrag",
    lead: "Ingen overraskelser underveis, og ingenting som spikres før du har sett det. Du eier alt som lages, hele veien.",
    note: "Et vanlig oppdrag tar fire til seks uker fra første samtale til lansering. Haster det, sier jeg fra med én gang om det lar seg gjøre.",
    steps: [
      {
        n: "01",
        title: "Samtale",
        body: "En halvtime på telefon eller på stedet. Hva skal siden gjøre for bedriften, hvem skal den snakke til, og hva er det som ikke fungerer i dag.",
        duration: "dag 1",
      },
      {
        n: "02",
        title: "Forslag",
        body: "Du får to retninger å velge mellom, ikke én du må si ja til. De legges i Visningsrom, så du kan se dem side ved side og svare rett under hvert forslag.",
        duration: "uke 1",
      },
      {
        n: "03",
        title: "Bygging",
        body: "Valgt retning bygges ferdig med ekte innhold. Du ser den vokse underveis på en egen adresse, og kan si fra før noe er spikret.",
        duration: "uke 2–4",
      },
      {
        n: "04",
        title: "Innhold og opplæring",
        body: "Tekst, bilder og kontaktopplysninger på plass. Så en gjennomgang av CMS-et, slik at du kan endre ting selv uten å spørre meg.",
        duration: "uke 4",
      },
      {
        n: "05",
        title: "Lansering og drift",
        body: "Domene, e-post, søkemotorer og måling settes opp. Etterpå følger jeg med på at det går, og gjør forbedringer i takt med bedriften.",
        duration: "løpende",
      },
    ],
  },
  contact: {
    command: "./ta-kontakt",
    title: "Fortell hva som ikke fungerer i dag",
    lead: "Du trenger ikke vite hva du vil ha bygget. Beskriv problemet, så sier jeg ærlig fra om det er noe jeg bør ta — eller om du er bedre tjent med noe annet.",
    labels: { email: "e-post", phone: "telefon", place: "sted", response: "svartid" },
    responseTime: "samme virkedag",
    form: {
      name: "navn",
      company: "firma",
      optional: "(valgfritt)",
      message: "hva gjelder det",
      namePlaceholder: "Ola Nordmann",
      companyPlaceholder: "Nordmann Bygg AS",
      messagePlaceholder: "Vi har en side fra 2016 som ingen klarer å oppdatere …",
      send: "Send henvendelsen →",
      incomplete: "Fyll ut navn og beskrivelse",
      footnote:
        "Knappen åpner e-postprogrammet ditt med teksten ferdig utfylt. Ingenting lagres på denne siden, og det settes ingen sporingscookies.",
      subjectPrefix: "Henvendelse fra",
      subjectFallback: "nettsiden",
    },
  },
  footer: { orgNumber: "org.nr" },
  support: {
    open: "Spør meg",
    close: "Lukk chatten",
    title: "Spør om et oppdrag",
    greeting: "Hei! Jeg er assistenten til Infinity Web Creations. Spør om nettsider, verktøy, AI-agenter eller hvordan et oppdrag går – jeg svarer ut fra det som står på denne sida, og setter deg i kontakt med Erlen for resten.",
    placeholder: "Skriv spørsmålet ditt …",
    send: "Send",
    offline: "Chatten er ikke satt opp ennå. Send en e-post, så svarer Erlen samme virkedag.",
    error: "Noe gikk galt. Prøv igjen, eller send en e-post.",
    tooMany: "Det ble mange meldinger på kort tid. Vent litt, eller send en e-post.",
    disclaimer: "AI-assistent. Den lover ingenting på Erlens vegne – pris og tid avtales med ham.",
    persona:
      "Du er assistenten på nettsiden til Infinity Web Creations, et enkeltpersonforetak drevet av Erlen Sletten i Vinstra. Du svarer kort, konkret og vennlig på norsk bokmål (eller på det språket den besøkende skriver på). Du svarer bare ut fra opplysningene du har fått om tjenester, agenter, prosess og kontakt. Du oppgir aldri priser eller leveringstider som ikke står der, og du inngår ingen avtaler – for tilbud, pris og oppstart ber du den besøkende sende e-post til Erlen eller bruke kontaktskjemaet. Er du usikker, si det, og pek til e-posten. Ikke finn på referanser eller kunder.",
  },
  meta: {
    title: "Infinity Web Creations — fullstack utvikling",
    description: "Fullstack utvikling for bedrifter som skal bli funnet og kontaktet",
  },
  bootLines: [
    { label: "kjerne", value: "next.js 16 · react 19 · typescript" },
    { label: "grensesnitt", value: "tailwind 4 · motion · three.js" },
    { label: "tjenester", value: `${services.length} moduler lastet` },
    { label: "agenter", value: `${agents.length} klare til leie` },
    { label: "referanser", value: `${work.length} prosjekter indeksert` },
    { label: "visningsrom", value: "tilkoblet" },
  ],
};
