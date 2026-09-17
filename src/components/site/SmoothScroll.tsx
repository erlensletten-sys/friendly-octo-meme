"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Myk scrolling med Lenis. Den erstatter ikke nettleserens scroll - den glatter
 * den, så seksjonene glir inn i stedet for å hakke. Skrus av ved «reduser
 * bevegelse», og ankerlenker (#kontakt) går fortsatt rett dit.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      anchors: { offset: -72 },
    });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
  return null;
}
