import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Tracker from "@/components/Tracker";
import { brand } from "@/lib/site/content";
import { introBootScript } from "@/lib/site/intro";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — fullstack utvikling`,
    template: `%s · ${brand.name}`,
  },
  description: brand.tagline,
  metadataBase: new URL("https://infinitywebcreations.no"),
  openGraph: {
    title: `${brand.name} — fullstack utvikling`,
    description: brand.tagline,
    locale: "nb_NO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: skriptet under setter data-intro på <html>
    // før React er i gang, og det er meningen.
    <html lang="nb" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Skjuler plassholderen for åpningen hos den som alt har sett den,
            før første bilde tegnes. Kjører før alt annet. */}
        <script dangerouslySetInnerHTML={{ __html: introBootScript }} />
      </head>
      <body className="grain min-h-screen antialiased">
        {children}
        <Tracker />
      </body>
    </html>
  );
}
