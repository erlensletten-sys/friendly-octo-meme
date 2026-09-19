import { LANG_COOKIE } from "@/lib/site/content";

/**
 * Språkvalget huskes i en cookie, ikke localStorage, fordi proxy.ts skal
 * kunne lese det på serveren og sende den som valgte engelsk rett til /en.
 * Ett år, hele nettstedet, SameSite=Lax.
 */
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Kjøres inline i <head>. ES5 og try/catch - må aldri kaste. */
export const langBootScript = `try{if(/(?:^|; )${LANG_COOKIE}=(nb|en)/.test(document.cookie))document.documentElement.setAttribute("data-lang","chosen")}catch(e){}`;

/** Leser cookien i nettleseren. null = ikke valgt ennå. */
export function readLangCookie(): "nb" | "en" | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=(nb|en)`));
    return m ? (m[1] as "nb" | "en") : null;
  } catch {
    return null;
  }
}

export function writeLangCookie(locale: "nb" | "en") {
  try {
    document.cookie = `${LANG_COOKIE}=${locale}; Max-Age=${LANG_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
  } catch {
    /* privat modus el.l. - da spør vi igjen neste gang */
  }
}

/** Gjett ut fra nettleserspråket, til forhåndsvalget på valgskjermen. */
export function guessLocale(): "nb" | "en" {
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const l of langs) {
      const code = (l || "").toLowerCase();
      if (code.startsWith("nb") || code.startsWith("nn") || code.startsWith("no")) return "nb";
      if (code.startsWith("en")) return "en";
    }
  } catch {
    /* ignorert */
  }
  return "nb";
}
