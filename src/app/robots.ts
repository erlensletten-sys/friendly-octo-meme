import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/analytics/shared";

/**
 * Søkemotorer får lese hjemmesiden. Verktøyet, kundelenkene og API-et er
 * ingen sin sak, og roboter som samler tekst til KI-trening får ingenting.
 * Robots.txt er en høflig beskjed - proxyen er det som faktisk stenger.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "CCBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "meta-externalagent",
  "Diffbot",
  "ImagesiftBot",
  "cohere-ai",
  "Omgilibot",
  "Timpibot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_CRAWLERS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/visningsrom", "/login", "/api/", "/serve/", "/s/"] },
    ],
    host: SITE_ORIGIN,
  };
}
