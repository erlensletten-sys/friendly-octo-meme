"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { brand, nav } from "@/lib/site/content";

export default function SiteNav() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => setSolid(value > 80));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "border-b border-ink-700/70 bg-ink-950/80 backdrop-blur-md" : ""
      }`}
    >
      <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-5 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="loop-text loop-text-animate text-xl leading-none font-semibold">∞</span>
          <span className="mono text-[13px] tracking-tight text-mist-200 group-hover:text-mist-100">
            {brand.name}
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="mono rounded-md px-3 py-1.5 text-[12px] text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-100"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href="/visningsrom"
          className="mono ml-auto rounded-md border border-ink-600 px-3 py-1.5 text-[12px] text-mist-200 transition-colors hover:border-[color:var(--color-loop-a)] hover:text-mist-100 md:ml-0"
        >
          Visningsrom
        </Link>
      </div>
    </motion.header>
  );
}
