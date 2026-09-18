"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSite } from "./SiteContext";

/**
 * Support-chatten: en knapp nede til høyre, og et lite terminalvindu som
 * svares av en AI-agent (/api/support). Samtalen lever i denne fana
 * (sessionStorage) og sendes med i hver forespørsel - serveren husker
 * ingenting. Svaret strømmes inn ord for ord.
 */

type Msg = { role: "user" | "assistant"; content: string };
const STORE_KEY = "iwc:support";

export default function SupportChat() {
  const { t, locale } = useSite();
  const s = t.support;
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  // Samtalen overlever en oppfrisking, men ikke at fana lukkes.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE_KEY);
      if (saved) setMessages(JSON.parse(saved) as Msg[]);
    } catch {
      /* privat modus el.l. */
    }
  }, []);
  useEffect(() => {
    try {
      if (messages.length) sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignorert */
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [messages, open, reduced]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setNotice(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);
    abort.current = new AbortController();
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, messages: next }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 503 || json.error === "offline") setOffline(true);
        setNotice(res.status === 429 ? s.tooMany : res.status === 503 ? s.offline : s.error);
        setMessages(next);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages([...next, { role: "assistant", content: snapshot }]);
      }
      if (!acc.trim()) {
        setNotice(s.error);
        setMessages(next);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setNotice(s.error);
        setMessages(next);
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }, [draft, busy, messages, locale, s]);

  useEffect(() => () => abort.current?.abort(), []);

  const shown: Msg[] = messages.length ? messages : [{ role: "assistant", content: s.greeting }];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            key="chat"
            role="dialog"
            aria-label={s.title}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            // edge-glow/scanlines setter position: relative, så den faste
            // plasseringen ligger på et eget ytre element.
            className="fixed right-4 bottom-20 z-[75] w-[min(400px,calc(100vw-2rem))] sm:right-6 sm:bottom-24"
            style={{ height: "min(560px, calc(100dvh - 7rem))" }}
          >
          <div className="scanlines edge-glow flex h-full flex-col overflow-hidden rounded-xl">
            <div className="flex items-center gap-2 border-b border-ink-700/80 bg-ink-900/90 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
              <span className="mono ml-2 truncate text-[11px] text-mist-400">{t.brand.shell}@web: ~/support</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={s.close}
                className="mono ml-auto flex h-8 w-8 items-center justify-center rounded-md text-mist-400 hover:bg-ink-800 hover:text-mist-100"
              >
                ×
              </button>
            </div>

            <div ref={list} className="flex-1 space-y-3 overflow-y-auto bg-ink-850/95 p-4">
              <p className="text-[13.5px] font-semibold tracking-tight">{s.title}</p>
              {shown.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-lg px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[color:var(--color-loop-a)] text-ink-950"
                        : "border border-ink-700 bg-ink-900 text-mist-200"
                    }`}
                  >
                    {m.role === "assistant" && (
                      <span className="mono mr-1.5 text-[11px] text-[color:var(--color-loop-b)]">&gt;</span>
                    )}
                    {m.content}
                    {m.role === "assistant" && busy && i === shown.length - 1 && <span className="caret" />}
                  </div>
                </div>
              ))}
              {notice && (
                <p className="mono text-[11.5px] text-[color:var(--color-amber-brand)]">
                  # {notice}{" "}
                  <a href={`mailto:${t.brand.email}`} className="underline">
                    {t.brand.email}
                  </a>
                </p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="border-t border-ink-700/80 bg-ink-900/90 p-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={input}
                  rows={1}
                  value={draft}
                  disabled={offline}
                  onChange={(e) => setDraft(e.target.value.slice(0, 1500))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder={offline ? s.offline : s.placeholder}
                  className="field mono max-h-32 min-h-11 flex-1 resize-none !text-[13px]"
                />
                <button
                  type="submit"
                  disabled={busy || offline || !draft.trim()}
                  className="mono flex min-h-11 items-center rounded-lg bg-[color:var(--color-loop-a)] px-4 text-[12px] font-semibold text-ink-950 disabled:opacity-40"
                >
                  {s.send}
                </button>
              </div>
              <p className="mono mt-2 text-[10.5px] leading-snug text-mist-500">{s.disclaimer}</p>
            </form>
          </div>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? s.close : s.open}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mono fixed right-4 bottom-4 z-[75] flex min-h-12 items-center gap-2 rounded-full border border-ink-600 bg-ink-900/90 px-4 text-[12px] text-mist-200 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors hover:border-[color:var(--color-loop-a)] hover:text-mist-100 sm:right-6 sm:bottom-6"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-loop-a)] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-loop-a)]" />
        </span>
        {open ? "×" : s.open}
      </motion.button>
    </>
  );
}
