"use client";

import { motion } from "motion/react";
import type { Project } from "@/lib/site/content";

const bar = "rounded-[3px] bg-ink-700";

/**
 * En grov skisse av sidens oppbygging, tegnet i stedet for et skjermbilde.
 * Poenget er strukturen - hvor tyngden ligger på sida - ikke fargene.
 */
export default function Wireframe({ rows }: { rows: Project["wireframe"] }) {
  return (
    <div className="flex aspect-[16/10] w-full flex-col gap-2 rounded-lg border border-ink-700/70 bg-ink-900 p-3">
      {rows.map((row, index) => (
        <motion.div
          key={`${row}-${index}`}
          initial={{ opacity: 0, scaleX: 0.86 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, delay: 0.06 * index, ease: [0.22, 1, 0.36, 1] }}
          style={{ originX: 0 }}
          className={row === "hero" ? "flex-[3]" : row === "split" || row === "grid" ? "flex-[2]" : ""}
        >
          {row === "nav" && (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[color:var(--color-loop-a)]/70" />
              <span className={`${bar} h-1.5 w-8`} />
              <span className={`${bar} ml-auto h-1.5 w-5`} />
              <span className={`${bar} h-1.5 w-5`} />
              <span className={`${bar} h-1.5 w-5`} />
            </div>
          )}

          {row === "hero" && (
            <div className="flex h-full flex-col justify-center gap-1.5 rounded-md bg-gradient-to-br from-[color:var(--color-loop-a)]/12 to-[color:var(--color-loop-b)]/12 px-3">
              <span className={`${bar} h-2.5 w-3/5`} />
              <span className={`${bar} h-2.5 w-2/5`} />
              <span className="mt-1 h-2 w-12 rounded-[3px] bg-[color:var(--color-loop-a)]/60" />
            </div>
          )}

          {row === "split" && (
            <div className="flex h-full gap-2">
              <span className={`${bar} h-full flex-1`} />
              <div className="flex h-full flex-[1.2] flex-col justify-center gap-1.5">
                <span className={`${bar} h-1.5 w-full`} />
                <span className={`${bar} h-1.5 w-4/5`} />
                <span className={`${bar} h-1.5 w-3/5`} />
              </div>
            </div>
          )}

          {row === "grid" && (
            <div className="grid h-full grid-cols-3 gap-2">
              <span className={`${bar} h-full`} />
              <span className={`${bar} h-full`} />
              <span className={`${bar} h-full`} />
            </div>
          )}

          {row === "band" && <span className={`${bar} block h-3 w-full opacity-80`} />}

          {row === "foot" && (
            <div className="mt-auto flex items-center gap-2 opacity-50">
              <span className={`${bar} h-1.5 w-10`} />
              <span className={`${bar} ml-auto h-1.5 w-6`} />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
