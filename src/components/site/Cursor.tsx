"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/**
 * En ring som følger musepekeren med litt treghet, og som åpner seg over
 * lenker og knapper. Den vanlige pekeren beholdes - dette er et lag oppå,
 * ikke en erstatning. Vises bare der det finnes en fin peker.
 */
export default function Cursor() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.35 });

  useEffect(() => {
    if (reduced) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;
    setEnabled(true);

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      const target = event.target as HTMLElement | null;
      setActive(Boolean(target?.closest("a, button, [role=button], input, textarea, select, label")));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, x, y]);

  if (!enabled) return null;

  // Ringen tegnes én gang i full størrelse og skaleres ned. Bredde, høyde og
  // kantbredde ville tvunget layout og maling på hvert bilde; scale og
  // opacity går rett på kompositoren.
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[90] h-11 w-11 rounded-full border-2 border-[color:var(--color-loop-a)] mix-blend-difference"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
      initial={{ scale: 0.5, opacity: 0.55 }}
      animate={{ scale: active ? 1 : 0.5, opacity: active ? 0.9 : 0.55 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    />
  );
}
