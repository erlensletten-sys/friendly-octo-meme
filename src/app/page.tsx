import Contact from "@/components/site/Contact";
import Cursor from "@/components/site/Cursor";
import Hero from "@/components/site/Hero";
import IntroGate from "@/components/site/IntroGate";
import Process from "@/components/site/Process";
import Services from "@/components/site/Services";
import SiteFooter from "@/components/site/SiteFooter";
import SiteNav from "@/components/site/SiteNav";
import SmoothScroll from "@/components/site/SmoothScroll";
import Work from "@/components/site/Work";

export default function HomePage() {
  return (
    <>
      <IntroGate />
      <SmoothScroll />
      <Cursor />
      <SiteNav />
      <main id="innhold">
        <Hero />
        <Services />
        <Work />
        <Process />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
