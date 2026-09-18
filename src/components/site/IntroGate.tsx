"use client";

import dynamic from "next/dynamic";
import { useIntroHold } from "./LanguageGate";

/**
 * Det som vises fra første bilde til three.js er lastet: samme mørke flate som
 * åpningen, og en markør som blinker. Uten den ville de første sekundene vært
 * svarte - eller verre, hjemmesiden ville blinket forbi før åpningen dekket den.
 * Skjules med CSS for den som alt har sett åpningen, og ved «reduser bevegelse».
 */
function IntroPlaceholder() {
  return (
    <div className="intro-placeholder fixed inset-0 z-[80] bg-ink-950" aria-hidden>
      <p className="mono absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[13px] text-mist-300">
        <span className="text-[color:var(--color-loop-a)]">$ </span>
        <span className="caret" />
      </p>
    </div>
  );
}

// Introen drar inn three.js og bloom. Den lastes bare i nettleseren, og bare
// på forsiden - resten av sida venter ikke på den.
const CinematicIntro = dynamic(() => import("./CinematicIntro"), {
  ssr: false,
  loading: IntroPlaceholder,
});

export default function IntroGate() {
  const hold = useIntroHold();
  return <CinematicIntro hold={hold} />;
}
