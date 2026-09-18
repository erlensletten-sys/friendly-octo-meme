import type { Locale } from "@/lib/site/content";
import Agents from "./Agents";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Hero from "./Hero";
import IntroGate from "./IntroGate";
import LanguageGate from "./LanguageGate";
import Process from "./Process";
import Services from "./Services";
import SiteFooter from "./SiteFooter";
import SiteNav from "./SiteNav";
import { SiteProvider } from "./SiteContext";
import SmoothScroll from "./SmoothScroll";
import Work from "./Work";

/** Hele forsida. Samme komponent for / og /en; bare innholdet byttes. */
export default function HomePage({ locale }: { locale: Locale }) {
  return (
    <SiteProvider locale={locale}>
      <LanguageGate>
        <IntroGate />
      </LanguageGate>
      <SmoothScroll />
      <Cursor />
      <SiteNav />
      <main id="innhold">
        <Hero />
        <Services />
        <Agents />
        <Work />
        <Process />
        <Contact />
      </main>
      <SiteFooter />
    </SiteProvider>
  );
}
