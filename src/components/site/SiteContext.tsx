"use client";

import { createContext, useContext } from "react";
import { getContent, homeHref, otherLocale, type Content, type Locale } from "@/lib/site/content";

type SiteValue = {
  locale: Locale;
  t: Content;
  /** Forsiden på det andre språket - der språkbryteren peker. */
  otherHref: string;
  otherLocale: Locale;
};

const SiteContext = createContext<SiteValue | null>(null);

/** Gir alle komponentene på hjemmesiden innholdet på riktig språk. */
export function SiteProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const other = otherLocale(locale);
  return (
    <SiteContext.Provider value={{ locale, t: getContent(locale), otherHref: homeHref(other), otherLocale: other }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite(): SiteValue {
  const value = useContext(SiteContext);
  if (!value) throw new Error("useSite må brukes under <SiteProvider>");
  return value;
}
