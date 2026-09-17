import BootIntro from "@/components/site/BootIntro";
import Contact from "@/components/site/Contact";
import Hero from "@/components/site/Hero";
import Process from "@/components/site/Process";
import Services from "@/components/site/Services";
import SiteFooter from "@/components/site/SiteFooter";
import SiteNav from "@/components/site/SiteNav";
import Work from "@/components/site/Work";

export default function HomePage() {
  return (
    <>
      <BootIntro />
      <SiteNav />
      <main>
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
