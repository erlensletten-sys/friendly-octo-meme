"use client";

import Link from "next/link";
import { motion } from "motion/react";
import SectionHead from "./SectionHead";
import { TerminalChrome } from "./Terminal";
import Tilt from "./Tilt";
import Wireframe from "./Wireframe";
import { projects } from "@/lib/site/content";

const statusStyle: Record<string, string> = {
  "i produksjon": "border-emerald-500/40 text-emerald-300",
  "under arbeid": "border-amber-brand/40 text-[color:var(--color-amber-brand)]",
  levert: "border-ink-600 text-mist-400",
};

export default function Work() {
  return (
    <section id="arbeid" className="scroll-mt-24 border-y border-ink-800/80 bg-ink-900/40">
      <div className="mx-auto max-w-[1180px] px-5 py-24 md:py-32">
        <SectionHead
          command="git log --oneline arbeid/"
          title="Det jeg har bygget"
          lead="Mest bygg og anlegg i Gudbrandsdalen, pluss verktøyene jeg lager for å gjøre den jobben bedre. Skissene viser hvordan sidene er satt sammen."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group h-full"
            >
              <Tilt className="h-full" max={5}>
              <TerminalChrome title={project.href ?? project.id} className="h-full">
                <div className="flex flex-1 flex-col gap-4 bg-ink-850/70 p-5">
                  <Wireframe rows={project.wireframe} />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[1.02rem] font-semibold tracking-tight">
                        {project.name}
                      </h3>
                      <p className="mono mt-1 truncate text-[11px] text-mist-400">
                        {project.sector}
                      </p>
                    </div>
                    <span
                      className={`mono shrink-0 rounded-md border px-2 py-1 text-[10px] ${
                        statusStyle[project.status] ?? statusStyle.levert
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <p className="text-[13.5px] leading-relaxed text-mist-300">{project.summary}</p>

                  <div className="mono mt-auto flex flex-wrap items-center gap-2 pt-1">
                    {project.stack.map((item) => (
                      <span
                        key={item}
                        className="rounded-md border border-ink-700 bg-ink-900 px-2 py-0.5 text-[10.5px] text-mist-400"
                      >
                        {item}
                      </span>
                    ))}
                    {project.href && (
                      project.href.startsWith("/") ? (
                        <Link
                          href={project.href}
                          className="ml-auto text-[11px] text-[color:var(--color-loop-a)] hover:underline"
                        >
                          åpne →
                        </Link>
                      ) : (
                        <a
                          href={project.href}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto text-[11px] text-[color:var(--color-loop-a)] hover:underline"
                        >
                          åpne →
                        </a>
                      )
                    )}
                  </div>
                </div>
              </TerminalChrome>
              </Tilt>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
