"use client";

import type { PreviewMessage } from "./messages";

const frames = new Set<HTMLIFrameElement>();
let enabled = false;
let listening = false;
const heightListeners = new Set<(frame: HTMLIFrameElement, height: number) => void>();

function ensureListener() {
  if (listening || typeof window === "undefined") return;
  listening = true;

  window.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as PreviewMessage | undefined;
    if (!data || data.__visningsrom !== true) return;

    if (data.type === "ready") {
      for (const frame of frames) {
        if (frame.contentWindow === event.source) {
          heightListeners.forEach((listener) => listener(frame, data.height));
        }
      }
      return;
    }

    if (data.type === "scroll" && enabled) {
      for (const frame of frames) {
        const target = frame.contentWindow;
        if (!target || target === event.source) continue;
        target.postMessage(
          { __visningsrom: true, type: "scrollTo", ratio: data.ratio },
          "*",
        );
      }
    }
  });
}

export function setSyncEnabled(value: boolean) {
  enabled = value;
}

export function registerFrame(frame: HTMLIFrameElement): () => void {
  ensureListener();
  frames.add(frame);
  return () => {
    frames.delete(frame);
  };
}

export function onFrameHeight(listener: (frame: HTMLIFrameElement, height: number) => void) {
  ensureListener();
  heightListeners.add(listener);
  return () => {
    heightListeners.delete(listener);
  };
}
