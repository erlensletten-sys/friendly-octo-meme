"use client";

import { motion } from "motion/react";
import SectionHead from "./SectionHead";
import { TerminalChrome } from "./Terminal";
import { services } from "@/lib/site/content";

export default function Services() {
  return (
    <section id="tjenester" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 py-24 md:py-32">
      <SectionHead
        command="ls tjenester/"
        title="Fire ting jeg gjør, og gjør ordentlig"
        lead="Jeg tar heller fire oppdrag i året som blir riktige enn tjue som blir omtrent. Under ligger det jeg faktisk leverer."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4 }}
          >
            <TerminalChrome title={service.command} className="h-full">
              <div className="flex flex-1 flex-col gap-4 bg-ink-850/70 p-6">
                <h3 className="text-[1.15rem] font-semibold tracking-tight">{service.title}</h3>
                <p className="text-[14px] leading-relaxed text-mist-300">{service.body}</p>
                <ul className="mono mt-auto flex flex-wrap gap-2 pt-2">
                  {service.bullets.map((bullet) => (
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
          </motion.div>
        ))}
      </div>
    </section>
  );
}
