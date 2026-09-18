"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { writeLangCookie } from "@/lib/site/lang";
import { useSite } from "./SiteContext";

/**
 * Språkbryteren setter cookien før den navigerer, ellers ville proxy.ts sendt
 * en som velger norsk rett tilbake til /en på neste besøk. Full sidelast er
 * riktig: de to språkene er to rot-layouter (ulik <html lang>).
 */
function LanguageSwitch({ className = "", long = false }: { className?: string; long?: boolean }) {
  const { t, otherLocale, otherHref } = useSite();
  const label = long ? (otherLocale === "en" ? "English" : "Norsk") : otherLocale === "en" ? "EN" : "NO";
  return (
    <a
      href={otherHref}
      hrefLang={otherLocale}
      lang={otherLocale}
      aria-label={t.ui.switchLanguage}
      title={t.ui.switchLanguage}
      onClick={() => writeLangCookie(otherLocale)}
      className={`mono flex min-h-11 items-center rounded-md px-3 text-[12px] uppercase tracking-wide text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-100 ${className}`}
    >
      {label}
    </a>
  );
}

export default function SiteNav() {
  const { t } = useSite();
  const { brand, nav } = t;
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => setSolid(value > 80));

  // Lukk menyen med Escape, og lås scroll bak den mens den er åpen.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <a
        href="#innhold"
        className="mono sr-only z-[70] rounded-md bg-[color:var(--color-loop-a)] px-3 py-2 text-[12px] font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t.ui.skipToContent}
      </a>

      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          open ? "border-b border-ink-700/70 bg-ink-950" : solid ? "border-b border-ink-700/70 bg-ink-950/85 backdrop-blur-md" : ""
        }`}
      >
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-3">
          <Link href="/" className="group flex min-h-11 items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="loop-text loop-text-animate text-xl leading-none font-semibold">∞</span>
            <span className="mono text-[13px] tracking-tight text-mist-200 group-hover:text-mist-100">
              {brand.name}
            </span>
          </Link>

          <nav aria-label={t.ui.mainMenu} className="ml-auto hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="mono flex min-h-11 items-center rounded-md px-3 text-[12px] text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-100"
              >
                {item.label}
              </a>
            ))}
            <LanguageSwitch />
          </nav>

          <Link
            href="/visningsrom"
            className="mono ml-auto hidden min-h-11 items-center rounded-md border border-ink-600 px-3 text-[12px] text-mist-200 transition-colors hover:border-[color:var(--color-loop-a)] hover:text-mist-100 md:ml-0 md:flex"
          >
            {t.ui.visningsrom}
          </Link>

          {/* Mobil: én tydelig handling, pluss menyknapp. */}
          <a
            href="#kontakt"
            className="mono ml-auto flex min-h-11 items-center rounded-md bg-[color:var(--color-loop-a)] px-3.5 text-[12px] font-semibold text-ink-950 md:hidden"
          >
            {t.ui.contact}
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobilmeny"
            aria-label={open ? t.ui.closeMenu : t.ui.openMenu}
            onClick={() => setOpen((value) => !value)}
            className="mono flex h-11 w-11 items-center justify-center rounded-md border border-ink-600 text-mist-200 md:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute inset-x-0 top-0 h-px bg-current transition-transform ${
                  open ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute inset-x-0 top-[6px] h-px bg-current transition-opacity ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute inset-x-0 bottom-0 h-px bg-current transition-transform ${
                  open ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              id="mobilmeny"
              aria-label={t.ui.mobileMenu}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="border-t border-ink-700/70 px-5 pt-2 pb-5 md:hidden"
            >
              <ul className="mono divide-y divide-ink-800">
                {nav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center text-[14px] text-mist-200"
                    >
                      <span className="mr-3 text-[color:var(--color-loop-a)]">›</span>
                      {item.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    href="/visningsrom"
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center text-[14px] text-mist-400"
                  >
                    <span className="mr-3 text-[color:var(--color-loop-b)]">›</span>
                    {t.ui.visningsrom}
                  </Link>
                </li>
                <li>
                  <LanguageSwitch long className="-ml-3 min-h-12 text-[14px] normal-case tracking-normal text-mist-400" />
                </li>
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
