import { RootShell, siteMetadata, siteViewport } from "@/components/site/RootShell";

/** Engelsk rot: bare forsida, på /en. Verktøydelen er norsk og bor i (no). */
export const metadata = siteMetadata("en");
export const viewport = siteViewport;

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <RootShell locale="en">{children}</RootShell>;
}
