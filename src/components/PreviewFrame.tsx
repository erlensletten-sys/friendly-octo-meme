"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { registerFrame } from "@/lib/frameSync";
import type { Preview } from "@/lib/types";

type Props = {
  preview: Preview;
  /** Bredden previewen skal rendres i, i CSS-piksler (enhetsbredde). */
  width: number;
  /** "thumb" skalerer ned til en fast boks og er ikke klikkbar. */
  mode?: "thumb" | "full";
  className?: string;
};

/**
 * Viser én preview i en iframe som skaleres ned til boksen den ligger i.
 *
 * Sandbox-reglene er ikke like for de to typene:
 *  - Opplastede pakker serveres fra vårt eget domene, så de får IKKE
 *    `allow-same-origin`. Da kjører de i en ugjennomsiktig origin og kan ikke
 *    røre cookies, localStorage eller API-ene våre.
 *  - Eksterne adresser ligger allerede på et annet domene. Der er
 *    `allow-same-origin` trygt, og uten den ville de fleste nettsteder brekke.
 */
export default function PreviewFrame({ preview, width, mode = "full", className }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = boxRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Ref-callback framfor useEffect: iframen monteres først når vi har målt
  // boksen, så en effekt som kjører ved montering ville ikke funnet den.
  // React 19 kjører opprydningsfunksjonen når noden forsvinner.
  const attachFrame = useCallback((node: HTMLIFrameElement | null) => {
    frameRef.current = node;
    if (!node) return;
    return registerFrame(node);
  }, []);

  const scale = box.width > 0 ? Math.min(1, box.width / width) : 0;
  const frameHeight = scale > 0 ? box.height / scale : 0;

  const src = preview.kind === "url" ? preview.url : `/serve/${preview.id}`;
  const sandbox =
    preview.kind === "url"
      ? "allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
      : "allow-scripts allow-forms allow-popups allow-modals allow-downloads";

  return (
    <div ref={boxRef} className={`relative overflow-hidden bg-white ${className ?? ""}`}>
      {scale > 0 && (
        <iframe
          ref={attachFrame}
          src={src}
          title={preview.title}
          loading={mode === "thumb" ? "lazy" : "eager"}
          sandbox={sandbox}
          referrerPolicy="no-referrer"
          style={{
            width,
            height: Math.max(frameHeight, 1),
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: "0",
            pointerEvents: mode === "thumb" ? "none" : "auto",
          }}
        />
      )}
    </div>
  );
}
