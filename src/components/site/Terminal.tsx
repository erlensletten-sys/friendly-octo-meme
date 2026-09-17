"use client";

import { useEffect, useRef, useState } from "react";

/** Skriver ut en tekst tegn for tegn. Returnerer også når den er ferdig. */
export function useTypewriter(text: string, speed = 22, enabled = true) {
  const [typed, setTyped] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setTyped(text);
      return;
    }
    setTyped("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, speed);
    return () => window.clearInterval(timer);
  }, [text, speed, enabled]);

  return { typed, done: typed.length >= text.length };
}

/** Bytter mellom flere setninger: skriver inn, står litt, sletter, neste. */
export function useRotatingTypewriter(phrases: string[], enabled = true) {
  const [text, setText] = useState(phrases[0] ?? "");
  const index = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled || phrases.length < 2) {
      setText(phrases[0] ?? "");
      return;
    }

    let cancelled = false;
    let chars = phrases[0].length;
    let erasing = true;

    const tick = () => {
      if (cancelled) return;
      const current = phrases[index.current];

      if (erasing) {
        chars -= 2;
        if (chars <= 0) {
          chars = 0;
          erasing = false;
          index.current = (index.current + 1) % phrases.length;
        }
      } else {
        chars += 1;
        if (chars >= current.length) {
          chars = current.length;
          erasing = true;
        }
      }

      const shown = phrases[index.current].slice(0, Math.max(0, chars));
      setText(shown);
      const delay = erasing && chars === phrases[index.current].length ? 2200 : erasing ? 22 : 38;
      timer.current = window.setTimeout(tick, delay);
    };

    timer.current = window.setTimeout(tick, 2400);
    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [phrases, enabled]);

  return text;
}

/** Vindusramma som går igjen over hele siden. */
export function TerminalChrome({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`scanlines edge-glow flex flex-col overflow-hidden rounded-xl ${className}`}>
      <div className="flex items-center gap-2 border-b border-ink-700/80 bg-ink-900/80 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="mono ml-2 truncate text-[11px] text-mist-400">{title}</span>
      </div>
      {children}
    </div>
  );
}
