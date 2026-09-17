"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { TerminalChrome } from "./Terminal";
import { bootLines, brand } from "@/lib/site/content";

const COMMAND = `boot --system=${brand.name.toLowerCase().replace(/\s+/g, "-")}`;
const SESSION_KEY = "iwc:boot";

/**
 * Oppstartssekvensen. Den kjører én gang per fane, kan hoppes over med et
 * klikk eller en tast, og hoppes helt over hvis brukeren har bedt om mindre
 * bevegelse - da er den bare i veien.
 */
export default function BootIntro() {
  const reduced = useReducedMotion();
  const [state, setState] = useState<"ukjent" | "kjører" | "ferdig">("ukjent");
  const [typed, setTyped] = useState("");
  const [lines, setLines] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* privat modus - da kjører den bare hver gang */
    }
    setState(seen || reduced ? "ferdig" : "kjører");
  }, [reduced]);

  const finish = useCallback(() => {
    setFlash(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignorert */
    }
    window.setTimeout(() => setState("ferdig"), 260);
  }, []);

  // Kommandoen skrives ut, så ramler statuslinjene inn én etter én.
  useEffect(() => {
    if (state !== "kjører") return;

    let index = 0;
    const typer = window.setInterval(() => {
      index += 1;
      setTyped(COMMAND.slice(0, index));
      if (index >= COMMAND.length) window.clearInterval(typer);
    }, 24);

    const startLines = window.setTimeout(() => {
      let shown = 0;
      const stepper = window.setInterval(() => {
        shown += 1;
        setLines(shown);
        if (shown >= bootLines.length) {
          window.clearInterval(stepper);
          window.setTimeout(finish, 560);
        }
      }, 165);
    }, COMMAND.length * 24 + 240);

    return () => {
      window.clearInterval(typer);
      window.clearTimeout(startLines);
    };
  }, [state, finish]);

  // Alt som ligner på utålmodighet hopper over resten.
  useEffect(() => {
    if (state !== "kjører") return;
    const skip = () => finish();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("wheel", skip, { passive: true });
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
      document.body.style.overflow = "";
    };
  }, [state, finish]);

  return (
    <AnimatePresence>
      {state === "kjører" && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-[80] grid place-items-center bg-ink-950 px-5"
          exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
          transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-xl"
          >
            <TerminalChrome title={`${brand.shell}@web: ~`}>
              <div className="mono space-y-1.5 bg-ink-950/80 px-4 py-5 text-[12px] leading-relaxed sm:text-[13px]">
                <p className="text-mist-200">
                  <span className="text-[color:var(--color-loop-a)]">$ </span>
                  {typed}
                  {typed.length < COMMAND.length && <span className="caret" />}
                </p>

                {bootLines.slice(0, lines).map((line) => (
                  <motion.p
                    key={line.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex gap-2 text-mist-400"
                  >
                    <span className="text-[color:var(--color-loop-a)]">[ ok ]</span>
                    <span className="w-28 shrink-0 text-mist-300">{line.label}</span>
                    <span className="truncate">{line.value}</span>
                  </motion.p>
                ))}

                {lines >= bootLines.length && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-1 text-mist-100"
                  >
                    <span className="text-[color:var(--color-loop-b)]">&gt; </span>
                    {brand.name}
                    <span className="caret" />
                  </motion.p>
                )}
              </div>
            </TerminalChrome>

            <p className="mono mt-4 text-center text-[11px] text-mist-400">
              trykk hvor som helst for å hoppe over
            </p>
          </motion.div>

          {/* Lysstripa som sveiper over skjermen i det sekvensen slippes. */}
          <AnimatePresence>
            {flash && (
              <motion.span
                className="pointer-events-none absolute inset-x-0 h-px bg-[color:var(--color-loop-a)]"
                initial={{ top: "0%", opacity: 0.9, boxShadow: "0 0 40px 10px rgba(62,240,220,0.5)" }}
                animate={{ top: "100%", opacity: 0 }}
                transition={{ duration: 0.36, ease: "easeIn" }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
