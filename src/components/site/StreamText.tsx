"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useState } from "react";

/**
 * Teksten kommer ord for ord, som når en chatbot svarer - men mykt: hvert ord
 * toner inn og glir opp i stedet for å hakke inn tegn for tegn. Bare opacity
 * og transform: en blur per ord malte hele avsnittet på nytt i hvert bilde.
 * Markøren i enden blinker til siste ord er på plass, og forsvinner så.
 */
export default function StreamText({
  text,
  as: Tag = "p",
  className = "",
  wordDelay = 0.032,
  delay = 0,
  cursor = true,
}: {
  text: string;
  as?: "p" | "h3" | "span";
  className?: string;
  wordDelay?: number;
  delay?: number;
  cursor?: boolean;
}) {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  const words = text.split(" ");

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduced ? 0 : wordDelay, delayChildren: reduced ? 0 : delay },
    },
  };

  const word: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const MotionTag = motion[Tag];

  return (
    <MotionTag
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      onAnimationComplete={() => setDone(true)}
      className={className}
      aria-label={text}
    >
      {words.map((item, index) => (
        <motion.span
          key={`${item}-${index}`}
          variants={word}
          className="inline-block"
          aria-hidden
        >
          {item}
          {index < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
      {cursor && !done && !reduced && <span className="caret" aria-hidden />}
    </MotionTag>
  );
}
