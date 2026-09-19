"use client";

import { motion, useReducedMotion } from "motion/react";
import type { AgentLine } from "@/lib/site/content";
import SectionHead from "./SectionHead";
import { TerminalChrome } from "./Terminal";
import Tilt from "./Tilt";
import { useSite } from "./SiteContext";

/**
 * AI-agenter til leie. Hvert kort er en terminal som «haler» loggen til én
 * agent: linjene kommer én og én når kortet rulles inn, så det leser seg som
 * noe som skjer - ikke som en punktliste om hva som kunne skjedd.
 */

const prompt: Record<AgentLine["who"], { mark: string; cls: string }> = {
  kunde: { mark: "$", cls: "text-mist-200" },
  agent: { mark: ">", cls: "text-[color:var(--color-loop-a)]" },
  system: { mark: "#", cls: "text-mist-400" },
};

function Log({ lines }: { lines: AgentLine[] }) {
  const { t } = useSite();
  const reduced = useReducedMotion();
  return (
    <ol className="mono space-y-2 rounded-lg border border-ink-700/70 bg-ink-900 p-3.5 text-[11.5px] leading-relaxed">
      {lines.map((line, index) => {
        const p = prompt[line.who];
        return (
          <motion.li
            key={index}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.35, delay: reduced ? 0 : 0.25 + index * 0.45 }}
            className="flex gap-2.5"
          >
            <span className={`w-20 shrink-0 whitespace-nowrap ${p.cls}`}>
              {p.mark} <span className="text-mist-500">{t.agents.speaker[line.who]}</span>
            </span>
            <span className={line.who === "system" ? "text-mist-400" : "text-mist-200"}>{line.text}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}

export default function Agents() {
  const { t } = useSite();
  const a = t.agents;

  return (
    <section id="agenter" className="scroll-mt-24 border-y border-ink-800/80 bg-ink-900/40">
      <div className="mx-auto max-w-[1180px] px-5 py-24 md:py-32">
        <SectionHead command={a.command} title={a.title} lead={a.lead} />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {a.items.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: (index % 2) * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="group h-full"
            >
              <Tilt className="h-full" max={5}>
                <TerminalChrome title={agent.command} className="h-full">
                  <div className="flex flex-1 flex-col gap-4 bg-ink-850/70 p-5">
                    <Log lines={agent.log} />
                    <div>
                      <h3 className="text-[1.15rem] font-semibold tracking-tight">{agent.title}</h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-mist-300">{agent.body}</p>
                    </div>
                    <ul className="mono mt-auto flex flex-wrap gap-2 pt-1">
                      {agent.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="rounded-md border border-ink-700 bg-ink-900 px-2.5 py-1 text-[11px] text-mist-400"
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TerminalChrome>
              </Tilt>
            </motion.div>
          ))}
        </div>

        <p className="mono mt-4 text-[11px] text-mist-500">
          <span className="text-mist-400"># </span>
          {a.exampleNote}
        </p>

        {/* Slik leies de */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]"
        >
          <div>
            <p className="mono text-[12px] text-mist-400">
              <span className="text-[color:var(--color-loop-a)]">$ </span>cat leie.md
            </p>
            <h3 className="mt-3 text-[1.5rem] leading-tight font-semibold tracking-[-0.03em]">{a.howTitle}</h3>

            <dl className="mono mt-6 space-y-2 text-[13px]">
              {a.price && (
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-mist-400">{a.priceLabel}</dt>
                  <dd className="text-mist-100">{a.price}</dd>
                </div>
              )}
            </dl>
            <p className="mt-2 max-w-[38ch] text-[13px] leading-relaxed text-mist-400">{a.priceNote}</p>

            <a
              href="#kontakt"
              className="mono mt-6 inline-flex min-h-12 items-center rounded-lg bg-[color:var(--color-loop-a)] px-5 text-[13px] font-semibold text-ink-950 transition-transform hover:scale-[1.03]"
            >
              {a.cta}
            </a>
          </div>

          <ol className="grid gap-4 sm:grid-cols-3">
            {a.how.map((step, index) => (
              <li key={step.title} className="panel flex flex-col gap-2 p-5">
                <span className="mono text-[12px] text-[color:var(--color-loop-b)]">0{index + 1}</span>
                <h4 className="text-[1.02rem] font-semibold tracking-tight">{step.title}</h4>
                <p className="text-[13.5px] leading-relaxed text-mist-300">{step.body}</p>
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}
