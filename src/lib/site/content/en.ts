import { brandShared, navHrefs, projects } from "./shared";
import type { Content } from "./types";

/**
 * English. Same shape as nb.ts - TypeScript refuses to build if a field is
 * missing here. Keep the voice: plain, concrete, no marketing gloss.
 */

const services: Content["services"]["items"] = [
  {
    id: "nettsider",
    command: "cat services/websites.md",
    title: "Websites with a CMS",
    body:
      "Sites built in Next.js with Sanity behind them, so the owner can change text and images without calling me. Fast on mobile, visible in search, and built to bring in enquiries.",
    bullets: ["Next.js + Sanity", "Content model in your language", "Enquiry tracking"],
  },
  {
    id: "verktoy",
    command: "cat services/tools.md",
    title: "Internal tools",
    body:
      "For when the spreadsheet no longer holds up: small, precise tools that solve one work process properly. Built around the way you already work, not the other way round.",
    bullets: ["Dashboards and overviews", "Forms and approvals", "Access and roles"],
  },
  {
    id: "integrasjoner",
    command: "cat services/integrations.md",
    title: "Integrations",
    body:
      "Connecting the systems you already pay for. Orders, hours, stock, e-mail and invoicing that talk to each other instead of being typed in twice.",
    bullets: ["APIs and webhooks", "Data cleaning and import", "Jobs that run themselves"],
  },
  {
    id: "drift",
    command: "cat services/operations.md",
    title: "Operations and follow-up",
    body:
      "A site is not finished when it launches. Monitoring, updates and small improvements as the business changes.",
    bullets: ["Monitoring and alerts", "Security updates", "One person to call"],
  },
];

const agents: Content["agents"]["items"] = [
  {
    id: "henvendelser",
    command: "tail -f agents/enquiries.log",
    title: "Enquiry agent",
    body:
      "Answers e-mail and web forms within minutes, around the clock. Asks the questions you would have asked, proposes a site visit from your calendar, and leaves everything ready in your inbox – you decide.",
    log: [
      { who: "kunde", text: "Hi, could you pour a concrete floor in a 120 m² garage in October?" },
      { who: "agent", text: "Yes, we can. Is there an existing slab, or should we do the groundwork too?" },
      { who: "kunde", text: "Existing slab. Vinstra." },
      { who: "system", text: "site visit proposed Tue 7 Oct 10:00 · placed in inbox for approval" },
    ],
    bullets: ["E-mail, forms, SMS", "Your tone, your rules", "Nothing is sent without your yes"],
  },
  {
    id: "tilbud",
    command: "tail -f agents/quotes.log",
    title: "Quote agent",
    body:
      "Takes your site-visit notes – text, photos, numbers on the phone – and writes the quote draft from your own templates and prices. You read it through and send it.",
    log: [
      { who: "system", text: "3 photos + 2 min voice memo received from site visit #214" },
      { who: "agent", text: "Draft ready: 118 m² floor slab, reinforcement, power-floating. One uncertain point: fall towards the drain – flagged yellow." },
      { who: "system", text: "quote-214.pdf saved to Quotes/Drafts" },
    ],
    bullets: ["Your templates and prices", "Flags what it is unsure about", "Drafts, never sent on its own"],
  },
  {
    id: "drift",
    command: "tail -f agents/operations.log",
    title: "Operations agent",
    body:
      "Watches the website and the tools. Checks that the form still sends, that the site is fast, that certificates renew – and only tells you when something actually needs you.",
    log: [
      { who: "system", text: "04:12 contact form tested · ok · 1.3 s" },
      { who: "system", text: "04:12 certificate renews in 61 days · ok" },
      { who: "agent", text: "Nothing to do tonight. Next report Monday 08:00." },
    ],
    bullets: ["Checks every night", "Weekly report in plain words", "Alerts only when it is urgent"],
  },
  {
    id: "innhold",
    command: "tail -f agents/content.log",
    title: "Content agent",
    body:
      "Keeps the website alive. Drafts new project pages from your photos and a couple of sentences, and suggests updates when something on the site has gone stale.",
    log: [
      { who: "kunde", text: "Finished the hall at Kvam today, 6 photos attached." },
      { who: "agent", text: "Project page drafted: “Industrial hall, Kvam – 640 m² fibre-reinforced floor”. Want the client named?" },
      { who: "system", text: "draft saved in CMS · not published" },
    ],
    bullets: ["Drafts straight into the CMS", "Your words, not ad copy", "You publish"],
  },
];

const work = projects([
  {
    id: "stenumgaard",
    name: "Stenumgaard Design",
    sector: "3D printing",
    summary:
      "A site with 3D product views right in the browser, so customers can turn the model around before they order.",
  },
  {
    id: "visningsrom",
    name: "Visningsrom",
    sector: "In-house tool",
    summary:
      "Where I put website proposals so the client can see them side by side at desktop, tablet and phone width and reply right underneath. Behind a login on this site.",
  },
  {
    id: "cryptopay",
    name: "CryptoPay",
    sector: "Bitcoin payments and escrow · in-house",
    summary:
      "A payment gateway where the money goes straight to the recipient's wallet — on-chain and Lightning, with 2-of-3 escrow and PGP-key sign-in instead of passwords. The demo runs against a stand-in API.",
  },
]);

export const en: Content = {
  locale: "en",
  brand: {
    ...brandShared,
    tagline: "Full-stack development for businesses that need to be found and contacted",
    location: "Vinstra, Gudbrandsdalen, Norway",
  },
  heroRotation: [
    "websites that load in under a second",
    "a CMS the owner can actually use",
    "AI agents that answer your customers",
    "integrations with the systems you already have",
    "tools built for one working day at a time",
  ],
  hero: {
    whoami: "Erlen Sletten — full-stack developer, ",
    title: ["Websites and tools", "that hold up", "to running a business"],
    buildsPrefix: "building ",
    lead: "I build for small and mid-sized businesses, mostly in construction. Everything I deliver should keep running without me — and keep improving with me.",
    ctaWork: "See the work",
    ctaContact: "Get in touch",
    available: "available for work",
    scroll: "scroll",
  },
  intro: { skip: "press anywhere to skip" },
  nav: [
    { href: navHrefs[0], label: "Services" },
    { href: navHrefs[1], label: "Agents" },
    { href: navHrefs[2], label: "Work" },
    { href: navHrefs[3], label: "Process" },
    { href: navHrefs[4], label: "Contact" },
  ],
  ui: {
    skipToContent: "Skip to content",
    visningsrom: "Showroom",
    contact: "Contact",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    mainMenu: "Main menu",
    mobileMenu: "Mobile menu",
    open: "open →",
    switchLanguage: "Bytt til norsk",
  },
  services: {
    command: "ls services/",
    title: "Four things I do, and do properly",
    lead: "I would rather take four jobs a year that come out right than twenty that come out roughly. Below is what I actually deliver.",
    items: services,
  },
  agents: {
    command: "ps aux | grep agent",
    title: "AI agents for hire",
    lead: "Small, well-bounded assistants that take one job in your business and do it every day. They work inside your systems, in your tone, and they never send anything without your say-so. You rent them by the month; I set them up and keep an eye on them.",
    items: agents,
    howTitle: "How hiring works",
    how: [
      {
        title: "One agent, one job",
        body: "We pick the job that steals the most time and set up one agent for it. Not ten at once.",
      },
      {
        title: "Two weeks on trial",
        body: "The agent runs alongside you, and you see every suggestion before it goes out. If it does not fit, it costs nothing.",
      },
      {
        title: "Monthly, cancel any time",
        body: "A fixed price per agent per month, adjustments and supervision included. Cancel when you like; the data is yours.",
      },
    ],
    priceLabel: "price",
    // TODO: set the real price, e.g. "from NOK 2,900 /month per agent". Empty = hidden.
    price: "",
    priceNote: "Setup is charged separately and priced by what the agent needs to connect to.",
    cta: "Ask about an agent",
    exampleNote: "The logs are examples of how the agents work, not real enquiries.",
    speaker: { kunde: "customer", agent: "agent", system: "system" },
  },
  work: {
    command: "git log --oneline work/",
    title: "What I have built",
    lead: "Three things you can look at right here. The frames below are the sites themselves, not screenshots – open them in a new tab to try them.",
    status: { live: "in production", wip: "in progress", delivered: "delivered" },
    items: work,
  },
  process: {
    command: "cat process.md",
    title: "How a project runs",
    lead: "No surprises along the way, and nothing nailed down before you have seen it. You own everything that is made, all the way through.",
    note: "A typical project takes four to six weeks from the first conversation to launch. If it is urgent, I will tell you straight away whether it can be done.",
    steps: [
      {
        n: "01",
        title: "Conversation",
        body: "Half an hour on the phone or on site. What the site should do for the business, who it should speak to, and what is not working today.",
        duration: "day 1",
      },
      {
        n: "02",
        title: "Proposals",
        body: "You get two directions to choose between, not one you have to say yes to. They go into the Showroom, so you can see them side by side and reply under each one.",
        duration: "week 1",
      },
      {
        n: "03",
        title: "Build",
        body: "The chosen direction is built out with real content. You watch it grow at its own address, and can speak up before anything is nailed down.",
        duration: "weeks 2–4",
      },
      {
        n: "04",
        title: "Content and training",
        body: "Text, images and contact details in place. Then a walk-through of the CMS, so you can change things yourself without asking me.",
        duration: "week 4",
      },
      {
        n: "05",
        title: "Launch and operations",
        body: "Domain, e-mail, search engines and analytics set up. Afterwards I keep an eye on it and make improvements as the business changes.",
        duration: "ongoing",
      },
    ],
  },
  contact: {
    command: "./get-in-touch",
    title: "Tell me what is not working today",
    lead: "You do not need to know what you want built. Describe the problem, and I will tell you honestly whether it is something I should take on — or whether you are better served by something else.",
    labels: { email: "e-mail", phone: "phone", place: "based in", response: "reply within" },
    responseTime: "the same working day",
    form: {
      name: "name",
      company: "company",
      optional: "(optional)",
      message: "what is it about",
      namePlaceholder: "Jane Smith",
      companyPlaceholder: "Smith Construction Ltd",
      messagePlaceholder: "We have a site from 2016 that nobody can update …",
      send: "Send the enquiry →",
      incomplete: "Fill in your name and a description",
      footnote:
        "The button opens your e-mail app with the text filled in. Nothing is stored on this site, and no tracking cookies are set.",
      subjectPrefix: "Enquiry from",
      subjectFallback: "the website",
    },
  },
  footer: { orgNumber: "org. no." },
  support: {
    open: "Ask me",
    close: "Close chat",
    title: "Ask about a project",
    greeting: "Hi! I'm the assistant for Infinity Web Creations. Ask about websites, tools, AI agents or how a project runs – I answer from what is on this page, and put you in touch with Erlen for the rest.",
    placeholder: "Type your question …",
    send: "Send",
    offline: "The chat is not set up yet. Send an e-mail and Erlen replies the same working day.",
    error: "Something went wrong. Try again, or send an e-mail.",
    tooMany: "That was a lot of messages in a short time. Wait a moment, or send an e-mail.",
    disclaimer: "AI assistant. It promises nothing on Erlen's behalf – price and timing are agreed with him.",
    persona:
      "You are the assistant on the website of Infinity Web Creations, a one-person business run by Erlen Sletten in Vinstra, Norway. You answer briefly, concretely and warmly in English (or in the language the visitor writes in). You answer only from the information you have been given about services, agents, process and contact. You never state prices or delivery times that are not in that information, and you make no agreements – for quotes, price and start dates you ask the visitor to e-mail Erlen or use the contact form. If unsure, say so and point to the e-mail. Never invent references or clients.",
  },
  meta: {
    title: "Infinity Web Creations — full-stack development",
    description: "Full-stack development for businesses that need to be found and contacted",
  },
  bootLines: [
    { label: "core", value: "next.js 16 · react 19 · typescript" },
    { label: "interface", value: "tailwind 4 · motion · three.js" },
    { label: "services", value: `${services.length} modules loaded` },
    { label: "agents", value: `${agents.length} ready for hire` },
    { label: "references", value: `${work.length} projects indexed` },
    { label: "showroom", value: "connected" },
  ],
};
