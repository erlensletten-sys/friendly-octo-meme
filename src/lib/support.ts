import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Content } from "@/lib/site/content";

/**
 * Support-chatten: en AI-agent som svarer ut fra det som står på hjemmesiden.
 *
 * Systemprompten bygges fra innholdet (tjenester, agenter, prosess, kontakt)
 * på det språket den besøkende har valgt, inkludert admins tekstendringer -
 * så agenten sier det sida sier, ikke noe eget. Den har ingen verktøy, ingen
 * tilgang til Visningsrom, og lagrer ingenting: samtalen lever i besøkendes
 * fane og sendes med i hver forespørsel.
 *
 * Tre leverandører, valgt av miljøvariablene (se .env.example):
 *  - cloudflare: Workers AI, gratis kvote hver dag. Standard når
 *    CLOUDFLARE_ACCOUNT_ID og CLOUDFLARE_AI_TOKEN er satt.
 *  - openai: et hvilket som helst OpenAI-kompatibelt endepunkt (Ollama,
 *    Groq, OpenRouter …) via SUPPORT_BASE_URL og SUPPORT_API_KEY.
 *  - anthropic: Claude via ANTHROPIC_API_KEY.
 * Alle strømmer svaret som ren tekst til klienten, så resten av appen ser
 * ingen forskjell.
 */

export const MAX_TURNS = 12; // meldinger som sendes med (de siste)
export const MAX_MESSAGE_CHARS = 1500;
export const MAX_OUTPUT_TOKENS = 500;

export type ChatMessage = { role: "user" | "assistant"; content: string };

type Provider =
  | { kind: "mock" }
  | { kind: "cloudflare"; baseUrl: string; apiKey: string; model: string }
  | { kind: "openai"; baseUrl: string; apiKey: string; model: string }
  | { kind: "anthropic"; apiKey: string; model: string };

const DEFAULTS = {
  cloudflare: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  openai: "llama3.1",
  anthropic: "claude-sonnet-5",
};

const env = (name: string) => process.env[name]?.trim() ?? "";

/** Hvilken leverandør miljøet peker på. null = chatten er av. */
export function resolveProvider(): Provider | null {
  const forced = env("SUPPORT_PROVIDER").toLowerCase();
  const model = env("SUPPORT_MODEL");

  if (env("ANTHROPIC_API_KEY") === "mock" || forced === "mock") return { kind: "mock" };

  const cf = { accountId: env("CLOUDFLARE_ACCOUNT_ID"), token: env("CLOUDFLARE_AI_TOKEN") };
  const oa = { baseUrl: env("SUPPORT_BASE_URL").replace(/\/$/, ""), apiKey: env("SUPPORT_API_KEY") };
  const an = env("ANTHROPIC_API_KEY");

  const order = forced ? [forced] : ["cloudflare", "openai", "anthropic"];
  for (const kind of order) {
    if (kind === "cloudflare" && cf.accountId && cf.token) {
      return {
        kind,
        baseUrl: `https://api.cloudflare.com/client/v4/accounts/${cf.accountId}/ai/v1`,
        apiKey: cf.token,
        model: model || DEFAULTS.cloudflare,
      };
    }
    if (kind === "openai" && oa.baseUrl) {
      return { kind, baseUrl: oa.baseUrl, apiKey: oa.apiKey, model: model || DEFAULTS.openai };
    }
    if (kind === "anthropic" && an) {
      return { kind, apiKey: an, model: model || DEFAULTS.anthropic };
    }
  }
  return null;
}

export function supportEnabled(): boolean {
  return resolveProvider() !== null;
}

/** Alt agenten får vite. Rene fakta fra sida, ingen løfter. */
export function buildSystemPrompt(t: Content): string {
  const lines: string[] = [];
  lines.push(t.support.persona);
  lines.push("");
  lines.push(`# ${t.brand.name}`);
  lines.push(`${t.brand.tagline}. Sted: ${t.brand.location}. E-post: ${t.brand.email}.${t.brand.phone ? ` Telefon: ${t.brand.phone}.` : ""}`);
  lines.push(`Hvem: ${t.hero.whoami}${t.brand.location}. ${t.hero.lead}`);
  lines.push("");
  lines.push(`# ${t.services.title}`);
  lines.push(t.services.lead);
  for (const s of t.services.items) lines.push(`- ${s.title}: ${s.body} (${s.bullets.join(", ")})`);
  lines.push("");
  lines.push(`# ${t.agents.title}`);
  lines.push(t.agents.lead);
  for (const a of t.agents.items) lines.push(`- ${a.title}: ${a.body} (${a.bullets.join(", ")})`);
  lines.push(`${t.agents.howTitle}: ${t.agents.how.map((h) => `${h.title} – ${h.body}`).join(" ")}`);
  lines.push(t.agents.price ? `${t.agents.priceLabel}: ${t.agents.price}. ${t.agents.priceNote}` : `Pris for agenter er ikke oppgitt på sida; ${t.agents.priceNote}`);
  lines.push("");
  lines.push(`# ${t.work.title}`);
  for (const p of t.work.items) lines.push(`- ${p.name} (${p.sector}, ${t.work.status[p.status]}): ${p.summary}`);
  lines.push("");
  lines.push(`# ${t.process.title}`);
  lines.push(t.process.lead);
  lines.push(t.process.note);
  for (const s of t.process.steps) lines.push(`${s.n}. ${s.title} (${s.duration}): ${s.body}`);
  lines.push("");
  lines.push(`# ${t.contact.title}`);
  lines.push(`${t.contact.lead} ${t.contact.labels.response}: ${t.contact.responseTime}. Kontaktskjemaet på sida åpner e-postprogrammet med teksten ferdig utfylt.`);
  lines.push("");
  lines.push("Svar med vanlig tekst, korte avsnitt, ingen markdown-overskrifter. Maks omtrent 120 ord per svar.");
  return lines.join("\n");
}

/** Rensker samtalen fra klienten: riktige roller, kappet, bare de siste. */
export function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const out: ChatMessage[] = [];
  for (const m of input) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const text = content.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!text) continue;
    // To like roller på rad slås sammen - API-ene krever veksling.
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += "\n" + text;
    else out.push({ role, content: text });
  }
  const trimmed = out.slice(-MAX_TURNS);
  // Må begynne med brukeren.
  while (trimmed.length && trimmed[0].role !== "user") trimmed.shift();
  return trimmed;
}

/* ---------------------------------------------------------- leverandørene */

const encoder = new TextEncoder();

function mockStream(): ReadableStream<Uint8Array> {
  const text = "Dette er et testsvar fra support-chatten. Sett opp en leverandør i .env.local for å få svar fra agenten.";
  return new ReadableStream({
    async start(controller) {
      for (const word of text.split(" ")) {
        controller.enqueue(encoder.encode(word + " "));
        await new Promise((r) => setTimeout(r, 40));
      }
      controller.close();
    },
  });
}

function anthropicStream(p: Extract<Provider, { kind: "anthropic" }>, system: string, messages: ChatMessage[]) {
  const client = new Anthropic({ apiKey: p.apiKey });
  const stream = client.messages.stream({ model: p.model, max_tokens: MAX_OUTPUT_TOKENS, system, messages });
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      stream.abort();
    },
  });
}

/**
 * OpenAI-formatet, som Cloudflare Workers AI, Ollama, Groq m.fl. snakker.
 * Strømmen er SSE med "data: {json}"-linjer; vi plukker ut delta.content.
 */
async function openAiStream(
  p: Extract<Provider, { kind: "cloudflare" | "openai" }>,
  system: string,
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(p.apiKey ? { authorization: `Bearer ${p.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: p.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`${p.kind} svarte ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[]; response?: string };
          const text = json.choices?.[0]?.delta?.content ?? json.response ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          /* halv linje - kommer i neste bolk */
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}

/** Strømmer svaret som ren tekst fra den leverandøren miljøet peker på. */
export async function streamReply(system: string, messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const p = resolveProvider();
  if (!p) throw new Error("Ingen leverandør er satt opp.");
  if (p.kind === "mock") return mockStream();
  if (p.kind === "anthropic") return anthropicStream(p, system, messages);
  return openAiStream(p, system, messages);
}

/* ------------------------------------------------------------ enkel brems */

const WINDOW_MS = 10 * 60 * 1000;
const PER_IP = 20;
const GLOBAL = 400;
const hits = new Map<string, number[]>();
let globalHits: number[] = [];

/** Sann hvis denne klienten (eller alle til sammen) har sendt for mye. */
export function overLimit(ip: string, now = Date.now()): boolean {
  const cutoff = now - WINDOW_MS;
  globalHits = globalHits.filter((t) => t > cutoff);
  if (globalHits.length >= GLOBAL) return true;
  const mine = (hits.get(ip) ?? []).filter((t) => t > cutoff);
  if (mine.length >= PER_IP) {
    hits.set(ip, mine);
    return true;
  }
  mine.push(now);
  hits.set(ip, mine);
  globalHits.push(now);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => t > cutoff)) hits.delete(k);
  return false;
}
