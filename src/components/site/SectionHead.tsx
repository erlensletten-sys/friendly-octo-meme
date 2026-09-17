"use client";

import { motion } from "motion/react";

export default function SectionHead({
  command,
  title,
  lead,
}: {
  command: string;
  title: string;
  lead?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[60ch]"
    >
      <p className="mono text-[12px] text-mist-400">
        <span className="text-[color:var(--color-loop-a)]">$ </span>
        {command}
      </p>
      <h2 className="mt-3 text-[clamp(1.7rem,3.6vw,2.6rem)] leading-tight font-semibold tracking-[-0.03em]">
        {title}
      </h2>
      {lead && <p className="mt-4 text-[15px] leading-relaxed text-mist-300">{lead}</p>}
    </motion.div>
  );
}
