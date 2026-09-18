import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getContent, homeHref, type Locale } from "@/lib/site/content";
import { introBootScript } from "@/lib/site/intro";
import { langBootScript } from "@/lib/site/lang";
import "@/app/globals.css";

/**
 * Det ytterste skallet, delt av begge rot-layoutene. To rot-layouter fordi
 * <html lang> må være riktig per språk, og bare en rot-layout kan sette den:
 * app/(no)/layout.tsx for norsk (og hele verktøydelen), app/(en)/en/layout.tsx
 * for engelsk. Å gå mellom dem er en full sidelast - det er greit for et
 * språkbytte.
 */

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face", display: "swap" });

const SITE_URL = "https://infinitywebcreations.no";

export function siteMetadata(locale: Locale): Metadata {
  const t = getContent(locale);
  return {
    title: { default: t.meta.title, template: `%s · ${t.brand.name}` },
    description: t.meta.description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: homeHref(locale),
      languages: { nb: "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      locale: locale === "en" ? "en_GB" : "nb_NO",
      alternateLocale: locale === "en" ? ["nb_NO"] : ["en_GB"],
      type: "website",
    },
  };
}

export const siteViewport: Viewport = { themeColor: "#05070a" };

export function RootShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: skriptene under setter data-attributter på
    // <html> før React er i gang, og det er meningen.
    <html lang={locale} className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Kjører før første bilde: skjuler språkvalget for den som alt har
            valgt, og åpningens plassholder for den som alt har sett den. */}
        <script dangerouslySetInnerHTML={{ __html: langBootScript + introBootScript }} />
      </head>
      <body className="grain min-h-screen antialiased">{children}</body>
    </html>
  );
}
