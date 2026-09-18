import { en } from "./en";
import { nb } from "./nb";
import type { Content, Locale } from "./types";

export type { Agent, AgentLine, Content, Locale, Project, ProjectStatus, Service, Step } from "./types";

export const LOCALES: Locale[] = ["nb", "en"];
export const DEFAULT_LOCALE: Locale = "nb";

/** Cookie som husker språkvalget. Leses av proxy.ts og av skriptet i <head>. */
export const LANG_COOKIE = "iwc_lang";

export function isLocale(value: unknown): value is Locale {
  return value === "nb" || value === "en";
}

export function getContent(locale: Locale): Content {
  return locale === "en" ? en : nb;
}

/** Forsiden på det gitte språket. Norsk bor på rota, engelsk under /en. */
export function homeHref(locale: Locale): string {
  return locale === "en" ? "/en" : "/";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "nb" : "en";
}
