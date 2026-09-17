"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRotatingTypewriter } from "./Terminal";
import { brand, heroRotation } from "@/lib/site/content";

// Three.js har ingenting på serveren å gjøre, og skal ikke ligge i
// hoved-bunten heller - den lastes når forsiden er i gang.
const InfinityScene = dynamic(() => import("./InfinityScene"), { ssr: false });

export default function Hero() {
  const reduced = useReducedMotion();
  const rotating = useRotatingTypewriter(heroRotation, !reduced);

  // Parallakse: sløyfa glir saktere enn teksten når du scroller, så det leser
  // seg som dybde og ikke som et flatt bilde som forsvinner oppover.
  const { scrollY } = useScroll();
  const loopY = useTransform(scrollY, [0, 900], [0, reduced ? 0 : 160]);
  const textY = useTransform(scrollY, [0, 900], [0, reduced ? 0 : -70]);
  const textOpacity = useTransform(scrollY, [0, 520], [1, 0.15]);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Sløyfa ligger bak teksten, tonet ned mot kantene så den aldri
          konkurrerer med det som faktisk skal leses. */}
      <motion.div style={{ y: loopY }} className="absolute inset-0">
        <InfinityScene className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(68%_58%_at_74%_54%,#000_30%,transparent_100%)] lg:opacity-80" />
      </motion.div>
      {/* Teksten står på et mørkt felt, så sløyfa aldri stjeler lesbarhet. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(5,7,10,0.97)_0%,rgba(5,7,10,0.88)_38%,rgba(5,7,10,0.35)_62%,transparent_86%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,var(--color-ink-950),transparent)]" />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative mx-auto w-full max-w-[1180px] px-5 pt-28 pb-20"
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mono text-[12px] text-mist-400"
        >
          <span className="text-[color:var(--color-loop-a)]">$ </span>whoami
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5 }}
          className="mono mt-1.5 text-[12px] text-mist-300"
        >
          Erlen Sletten — fullstack utvikler, {brand.location}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 max-w-[15ch] text-[clamp(2.4rem,6.6vw,4.7rem)] leading-[0.98] font-semibold tracking-[-0.035em]"
        >
          Nettsider og verktøy{" "}
          <span className="loop-text loop-text-animate whitespace-nowrap">som holder</span>{" "}
          å drive bedrift med
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="mono mt-6 flex min-h-[1.6em] items-center text-[13px] text-mist-300"
        >
          <span className="mr-2 text-[color:var(--color-loop-b)]">&gt;</span>
          <span>bygger {rotating}</span>
          <span className="caret" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-7 max-w-[56ch] text-[15px] leading-relaxed text-mist-300"
        >
          Jeg bygger for små og mellomstore bedrifter, mest innen bygg og anlegg. Alt jeg leverer
          skal kunne driftes videre uten meg — og forbedres videre med meg.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.6 }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <a
            href="#arbeid"
            className="mono flex min-h-12 items-center rounded-lg bg-[color:var(--color-loop-a)] px-5 text-[13px] font-semibold text-ink-950 transition-transform hover:scale-[1.03]"
          >
            Se arbeidet
          </a>
          <a
            href="#kontakt"
            className="mono flex min-h-12 items-center rounded-lg border border-ink-600 px-5 text-[13px] text-mist-200 transition-colors hover:border-[color:var(--color-loop-b)] hover:text-mist-100"
          >
            Ta kontakt
          </a>
          <span className="mono ml-1 flex items-center gap-2 text-[12px] text-mist-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            ledig for oppdrag
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="mono absolute inset-x-0 bottom-6 flex justify-center text-[11px] text-mist-400"
      >
        <span className="flex items-center gap-2">
          scroll
          <motion.span
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.span>
        </span>
      </motion.div>
    </section>
  );
}
