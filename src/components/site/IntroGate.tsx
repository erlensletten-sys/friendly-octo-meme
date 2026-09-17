"use client";

import dynamic from "next/dynamic";

// Introen drar inn three.js og bloom. Den lastes bare i nettleseren, og bare
// på forsiden - resten av sida venter ikke på den.
const CinematicIntro = dynamic(() => import("./CinematicIntro"), { ssr: false });

export default function IntroGate() {
  return <CinematicIntro />;
}
