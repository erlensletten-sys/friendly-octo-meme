import "server-only";
import { getContent, type Content, type Locale } from "./content";
import { applyOverrides } from "./overrides";
import { getSiteText } from "@/lib/store";

/** Innholdet slik det skal vises: standardteksten med admins endringer oppå. */
export async function loadContent(locale: Locale): Promise<Content> {
  return applyOverrides(getContent(locale), await getSiteText(locale));
}
