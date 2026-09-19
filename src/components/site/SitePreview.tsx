"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sida selv, i kortet. En iframe tegnet i full desktop-bredde og skalert ned
 * til kortets bredde med transform - da ser besøkende den ekte sida slik
 * den er, ikke et skjermbilde som blir gammelt. Et gjennomsiktig lag oppå
 * hindrer at scroll og klikk fanges av ramma; hele kortet er én lenke som
 * åpner sida for seg. Lastes først når kortet nærmer seg skjermen.
 */

const FRAME_W = 1280;
const FRAME_H = 800; // 16:10, som skissene

export default function SitePreview({ src, title }: { src: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [near, setNear] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const measure = () => setScale(node.clientWidth / FRAME_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(node);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={host}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-ink-700/70 bg-ink-900"
    >
      {near && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          style={{
            width: FRAME_W,
            height: FRAME_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
          className="pointer-events-none absolute top-0 left-0 border-0 bg-ink-950"
        />
      )}
      {/* Markør mens sida laster - samme som overalt ellers. */}
      {!loaded && (
        <p className="mono absolute inset-0 flex items-center justify-center text-[12px] text-mist-400" aria-hidden>
          <span className="text-[color:var(--color-loop-a)]">$ </span>
          <span className="caret" />
        </p>
      )}
      {/* Fanger scroll og klikk, så ramma aldri stjeler dem fra sida rundt. */}
      <span className="absolute inset-0" aria-hidden />
    </div>
  );
}
