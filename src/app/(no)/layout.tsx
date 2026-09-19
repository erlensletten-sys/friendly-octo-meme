import { RootShell, siteMetadata, siteViewport } from "@/components/site/RootShell";

/** Norsk rot: forsida på /, og hele verktøydelen (Visningsrom, API, CryptoPay). */
export const metadata = siteMetadata("nb");
export const viewport = siteViewport;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootShell locale="nb">{children}</RootShell>;
}
