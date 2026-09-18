"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

const GLOW = 840; // diameter på lysrefleksen i px

/**
 * Kortet vipper mot musepekeren i 3D og får en lysrefleks som følger den.
 * Bare med fin peker (mus); på berøring er det et vanlig kort.
 */
export default function Tilt({
  children,
  className = "",
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // Målt ved inngang, ikke på hver bevegelse: getBoundingClientRect midt i en
  // animasjon tvinger nettleseren til å regne ut layout på nytt.
  const rect = useRef<DOMRect | null>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 160, damping: 22, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 160, damping: 22, mass: 0.4 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  // Refleksen er en ferdigmalt sirkel som flyttes med transform. Å bygge en ny
  // radial-gradient per bilde ville malt hele kortet på nytt hver gang.
  const glowX = useTransform(sx, (v) => v * (rect.current?.width ?? 0) - GLOW / 2);
  const glowY = useTransform(sy, (v) => v * (rect.current?.height ?? 0) - GLOW / 2);

  function onEnter(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    rect.current = ref.current?.getBoundingClientRect() ?? null;
  }

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const box = rect.current;
    if (!box) return;
    px.set((event.clientX - box.left) / box.width);
    py.set((event.clientY - box.top) / box.height);
  }

  function onLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        rotateX: reduced ? 0 : rotateX,
        rotateY: reduced ? 0 : rotateY,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className}`}
    >
      {children}
      {!reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <motion.span
            className="absolute top-0 left-0 rounded-full bg-[radial-gradient(closest-side,rgba(62,240,220,0.10),transparent)]"
            style={{ width: GLOW, height: GLOW, x: glowX, y: glowY }}
          />
        </span>
      )}
    </motion.div>
  );
}
