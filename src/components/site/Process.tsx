"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import SectionHead from "./SectionHead";
import StreamText from "./StreamText";
import { useSite } from "./SiteContext";

export default function Process() {
  const { t } = useSite();
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Linja tegner seg i takt med at seksjonen passerer skjermen.
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start 70%", "end 60%"],
  });
  const drawn = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const glowTop = useTransform(drawn, (value) => `${value * 100}%`);

  return (
    <section
      id="prosess"
      className="mx-auto grid max-w-[1180px] scroll-mt-24 gap-x-16 gap-y-12 px-5 py-24 md:py-32 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]"
    >
      <div className="lg:sticky lg:top-28 lg:self-start">
        <SectionHead command={t.process.command} title={t.process.title} lead={t.process.lead} />
        <p className="mono mt-8 hidden max-w-[34ch] rounded-lg border border-ink-700 bg-ink-900/60 p-4 text-[11.5px] leading-relaxed text-mist-400 lg:block">
          <span className="text-[color:var(--color-loop-a)]"># </span>
          {t.process.note}
        </p>
      </div>

      <div ref={track} className="relative pl-10 sm:pl-16 lg:mt-2">
        {/* Spor + lyspunkt som følger scrollen. */}
        <div className="absolute top-2 bottom-2 left-[13px] w-px bg-ink-700 sm:left-[29px]" />
        <motion.div
          style={{ scaleY: drawn, originY: 0 }}
          className="absolute top-2 bottom-2 left-[13px] w-px bg-gradient-to-b from-[color:var(--color-loop-a)] to-[color:var(--color-loop-b)] sm:left-[29px]"
        />
        <motion.span
          style={{ top: glowTop }}
          className="absolute left-[9px] h-2 w-2 rounded-full bg-[color:var(--color-loop-a)] shadow-[0_0_14px_4px_rgba(62,240,220,0.45)] sm:left-[25px]"
        />

        <ol className="space-y-12" style={{ perspective: 1100 }}>
          {t.process.steps.map((step) => (
            <motion.li
              key={step.n}
              // Hvert steg svinger inn fra dybden, som et kort som legges ned på
              // bordet, før teksten begynner å strømme inn.
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, rotateX: -22, z: -60 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0, z: 0 }}
              viewport={{ once: true, amount: 0.55 }}
              transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "top left", transformStyle: "preserve-3d" }}
              className="relative"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.55 }}
                transition={{ duration: 0.45, delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
                className="mono absolute top-0.5 -left-10 text-[12px] text-mist-400 sm:-left-16"
              >
                {step.n}
              </motion.span>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <StreamText
                  as="h3"
                  text={step.title}
                  wordDelay={0.07}
                  delay={0.25}
                  cursor={false}
                  className="text-[1.15rem] font-semibold tracking-tight"
                />
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.55 }}
                  transition={{ duration: 0.4, delay: 0.55 }}
                  className="mono rounded-md border border-ink-700 px-2 py-0.5 text-[10.5px] text-mist-400"
                >
                  {step.duration}
                </motion.span>
              </div>

              <StreamText
                text={step.body}
                delay={0.5}
                wordDelay={0.028}
                className="mt-2.5 max-w-[62ch] text-[14.5px] leading-relaxed text-mist-300"
              />
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
