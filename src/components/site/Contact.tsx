"use client";

import { motion } from "motion/react";
import { useState } from "react";
import SectionHead from "./SectionHead";
import { TerminalChrome } from "./Terminal";
import { useSite } from "./SiteContext";

/**
 * Skjemaet setter sammen en e-post og åpner den i brukerens eget
 * e-postprogram. Da trengs ingen skjematjeneste, ingen cookies og ingen
 * database - og henvendelsen havner der Erlen faktisk leser den.
 */
export default function Contact() {
  const { t } = useSite();
  const { brand } = t;
  const f = t.contact.form;
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");

  const ready = name.trim().length > 1 && message.trim().length > 4;

  const mailto = `mailto:${brand.email}?subject=${encodeURIComponent(
    f.subject(name, company),
  )}&body=${encodeURIComponent(`${message}\n\n— ${name}${company ? `, ${company}` : ""}`)}`;

  return (
    <section id="kontakt" className="scroll-mt-24 border-t border-ink-800/80 bg-ink-900/40">
      <div className="mx-auto max-w-[1180px] px-5 py-24 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          <div>
            <SectionHead command={t.contact.command} title={t.contact.title} lead={t.contact.lead} />

            <dl className="mono mt-10 space-y-3 text-[13px]">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-mist-400">{t.contact.labels.email}</dt>
                <dd>
                  <a
                    href={`mailto:${brand.email}`}
                    className="text-[color:var(--color-loop-a)] hover:underline"
                  >
                    {brand.email}
                  </a>
                </dd>
              </div>
              {brand.phone && (
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-mist-400">{t.contact.labels.phone}</dt>
                  <dd className="text-mist-200">{brand.phone}</dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-mist-400">{t.contact.labels.place}</dt>
                <dd className="text-mist-200">{brand.location}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-mist-400">{t.contact.labels.response}</dt>
                <dd className="text-mist-200">{t.contact.responseTime}</dd>
              </div>
            </dl>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <TerminalChrome title={`${brand.shell}@web: ~/kontakt`}>
              <div className="space-y-4 bg-ink-850/70 p-6">
                <label className="block">
                  <span className="mono mb-1.5 block text-[11px] text-mist-400">
                    <span className="text-[color:var(--color-loop-a)]">$ </span>{f.name}
                  </span>
                  <input
                    className="field mono !text-[13px]"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={f.namePlaceholder}
                  />
                </label>

                <label className="block">
                  <span className="mono mb-1.5 block text-[11px] text-mist-400">
                    <span className="text-[color:var(--color-loop-a)]">$ </span>{f.company}
                    <span className="text-mist-500"> {f.optional}</span>
                  </span>
                  <input
                    className="field mono !text-[13px]"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder={f.companyPlaceholder}
                  />
                </label>

                <label className="block">
                  <span className="mono mb-1.5 block text-[11px] text-mist-400">
                    <span className="text-[color:var(--color-loop-a)]">$ </span>{f.message}
                  </span>
                  <textarea
                    className="field mono resize-none !text-[13px]"
                    rows={5}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={f.messagePlaceholder}
                  />
                </label>

                <a
                  href={ready ? mailto : undefined}
                  aria-disabled={!ready}
                  className={`mono block rounded-lg px-5 py-3 text-center text-[13px] font-semibold transition-colors ${
                    ready
                      ? "bg-[color:var(--color-loop-a)] text-ink-950 hover:bg-[#6ff6e6]"
                      : "cursor-not-allowed border border-ink-700 text-mist-400"
                  }`}
                >
                  {ready ? f.send : f.incomplete}
                </a>

                <p className="text-[11px] leading-relaxed text-mist-400">
                  {f.footnote}
                </p>
              </div>
            </TerminalChrome>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
