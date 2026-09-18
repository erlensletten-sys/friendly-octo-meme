"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { homeHref, type Locale } from "@/lib/site/content";
import { guessLocale, readLangCookie, writeLangCookie } from "@/lib/site/lang";
import { useSite } from "./SiteContext";

/**
 * Første gang noen kommer: en mørk skjerm i samme stil som åpningen, der de
 * velger norsk eller engelsk. Valget forhåndsmerkes ut fra nettleserspråket,
 * huskes i en cookie, og skjermen vises aldri igjen - bytte senere skjer i
 * menyen. Åpningen holdes tilbake til valget er gjort, så de to ikke
 * konkurrerer om oppmerksomheten.
 *
 * Skjermen ligger i server-HTML-en (så den er der fra første bilde), og
 * skjules med CSS av skriptet i <head> for den som alt har valgt.
 */

const IntroHold = createContext(false);

/** Sann mens språkvalget vises. Åpningen venter til den er usann. */
export function useIntroHold(): boolean {
  return useContext(IntroHold);
}

const OPTIONS: { locale: Locale; name: string; hint: string }[] = [
  { locale: "nb", name: "Norsk", hint: "Fortsett på norsk" },
  { locale: "en", name: "English", hint: "Continue in English" },
];

export default function LanguageGate({ children }: { children: React.ReactNode }) {
  const { locale } = useSite();
  // null = vet ikke ennå (server / før effekt), true = valgt, false = må velge.
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [focused, setFocused] = useState<Locale>("nb");
  const buttons = useRef<Record<Locale, HTMLButtonElement | null>>({ nb: null, en: null });

  useEffect(() => {
    const saved = readLangCookie();
    if (saved) {
      setChosen(true);
      return;
    }
    const guess = guessLocale();
    setFocused(guess);
    setChosen(false);
  }, []);

  // Skjermen eier tastaturet og låser scroll mens den vises.
  useEffect(() => {
    if (chosen !== false) return;
    document.body.style.overflow = "hidden";
    buttons.current[focused]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        setFocused("nb");
        buttons.current.nb?.focus();
      } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        setFocused("en");
        buttons.current.en?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [chosen, focused]);

  const choose = useCallback(
    (pick: Locale) => {
      writeLangCookie(pick);
      if (pick !== locale) {
        // Et annet språk er en annen rot-layout, så dette er en full sidelast.
        window.location.assign(homeHref(pick));
        return;
      }
      setChosen(true);
    },
    [locale],
  );

  const showing = chosen === false || chosen === null;

  return (
    <IntroHold.Provider value={chosen !== true}>
      {chosen !== true && (
        <div
          className="lang-gate fixed inset-0 z-[85] flex items-center justify-center bg-ink-950 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lang-gate-title"
          aria-hidden={!showing}
        >
          <div className="w-full max-w-[560px]">
            <p className="mono text-[12px] text-mist-400">
              <span className="text-[color:var(--color-loop-a)]">$ </span>select --lang
            </p>
            <h1 id="lang-gate-title" className="mt-4 text-[clamp(1.6rem,4.5vw,2.4rem)] leading-tight font-semibold tracking-[-0.03em]">
              <span className="loop-text loop-text-animate">∞</span> Velg språk
              <span className="text-mist-400"> / Choose language</span>
            </h1>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {OPTIONS.map((option) => {
                const active = focused === option.locale;
                return (
                  <button
                    key={option.locale}
                    ref={(node) => {
                      buttons.current[option.locale] = node;
                    }}
                    type="button"
                    lang={option.locale}
                    onClick={() => choose(option.locale)}
                    onFocus={() => setFocused(option.locale)}
                    onPointerEnter={() => setFocused(option.locale)}
                    className={`group flex min-h-[88px] flex-col items-start justify-center rounded-xl border px-5 py-4 text-left transition-colors ${
                      active
                        ? "border-[color:var(--color-loop-a)] bg-ink-850"
                        : "border-ink-700 bg-ink-900/60 hover:border-ink-500"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[1.15rem] font-semibold tracking-tight">
                      <span
                        className={`mono text-[12px] ${active ? "text-[color:var(--color-loop-a)]" : "text-mist-500"}`}
                        aria-hidden
                      >
                        {active ? "›" : " "}
                      </span>
                      {option.name}
                    </span>
                    <span className="mono mt-1 pl-5 text-[11.5px] text-mist-400">{option.hint}</span>
                  </button>
                );
              })}
            </div>

            <p className="mono mt-6 text-[11px] text-mist-500">
              enter ↵ · ←→ · <span className="text-mist-400">huskes / remembered</span>
            </p>
          </div>
        </div>
      )}
      {children}
    </IntroHold.Provider>
  );
}
