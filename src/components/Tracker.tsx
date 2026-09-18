"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  allowedHosts,
  MAX_CLICKS,
  SECTIONS,
  SITE_ORIGIN,
  TRACK_PATH,
  UNTRACKED_PREFIXES,
  type Beacon,
  type ClickRecord,
  type PageviewBeacon,
} from "@/lib/analytics/shared";

const IDLE_MS = 30_000; // uten mus, tast eller scroll så lenge regnes ikke tida som aktiv
const FIRST_SEND_MS = 5_000; // første sending, så besøk som aldri får pagehide også telles

/**
 * Måler besøk uten cookies og uten tredjepart: hvor lenge noen faktisk er
 * aktive, hvor langt de scroller, hvilke seksjoner de ser og hva de klikker på.
 * Alt samles i nettleseren og sendes som én sidevisning - på nytt med samme id
 * når siden skjules, så serveren bare overskriver.
 *
 * Kjører sida på et vertsnavn som ikke er vårt, er den kopiert. Da meldes
 * kopien inn, og den besøkende sendes til originalen.
 */
export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!allowedHosts().includes(location.hostname.toLowerCase())) {
      reportClone();
      return;
    }
    if (UNTRACKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    return startPageview(pathname);
  }, [pathname]);

  return null;
}

function send(beacon: Beacon, url = TRACK_PATH) {
  const body = JSON.stringify(beacon);
  try {
    // text/plain gjør at nettleseren ikke trenger en preflight, heller ikke
    // når en kopi på et annet domene melder fra.
    if (navigator.sendBeacon?.(url, new Blob([body], { type: "text/plain" }))) return;
  } catch {
    /* faller tilbake under */
  }
  fetch(url, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(
    () => {},
  );
}

function reportClone() {
  send(
    { kind: "clone", host: location.hostname.toLowerCase(), href: location.href, referrer: document.referrer },
    `${SITE_ORIGIN}${TRACK_PATH}`,
  );
  // Litt pusterom så beaconen er ute før siden byttes.
  window.setTimeout(() => {
    location.replace(`${SITE_ORIGIN}${location.pathname}${location.hash}`);
  }, 150);
}

function startPageview(path: string): () => void {
  const started = Date.now();
  const params = new URLSearchParams(location.search);
  const beacon: PageviewBeacon = {
    kind: "pageview",
    id: `${started.toString(36)}-${Math.random().toString(36).slice(2, 12).padEnd(6, "0")}`,
    path,
    referrer: document.referrer,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    screenW: window.innerWidth,
    lang: navigator.language,
    activeMs: 0,
    scroll: 0,
    sections: [],
    clicks: [],
  };

  let lastInput = Date.now();
  let lastSent = "";
  let firstSent = false;

  const flush = () => {
    const snapshot = JSON.stringify(beacon);
    if (snapshot === lastSent) return;
    lastSent = snapshot;
    send(beacon);
  };

  const onInput = () => {
    lastInput = Date.now();
  };

  // Scrolldybde leses én gang per bilde, og bare leses - aldri skrevet - så
  // den tvinger ikke fram ekstra layout midt i en animasjon.
  let scrollQueued = false;
  const onScroll = () => {
    lastInput = Date.now();
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const doc = document.documentElement;
      const seen = ((window.scrollY + window.innerHeight) / Math.max(1, doc.scrollHeight)) * 100;
      beacon.scroll = Math.max(beacon.scroll, Math.min(100, Math.round(seen)));
    });
  };
  onScroll();

  const onClick = (event: MouseEvent) => {
    if (beacon.clicks.length >= MAX_CLICKS) return;
    const target = (event.target as Element | null)?.closest<HTMLElement>(
      "a, button, [role=button], summary, input[type=submit]",
    );
    if (!target) return;
    const label = (target.getAttribute("aria-label") || target.textContent || target.getAttribute("title") || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    const section = target.closest("section[id]")?.id;
    const click: ClickRecord = {
      label: label || target.tagName.toLowerCase(),
      href: target.getAttribute("href") ?? undefined,
      section: SECTIONS.includes(section as never) ? section : undefined,
      at: Date.now() - started,
    };
    beacon.clicks.push(click);
    // Lenker ut av sida kan ta med seg fanen før pagehide rekker å fyre.
    if (click.href && !click.href.startsWith("#")) flush();
  };

  const onHide = () => {
    if (document.visibilityState === "hidden") flush();
  };

  const ticker = window.setInterval(() => {
    if (document.visibilityState !== "visible" || Date.now() - lastInput > IDLE_MS) return;
    beacon.activeMs += 1000;
    if (!firstSent && beacon.activeMs >= FIRST_SEND_MS) {
      firstSent = true;
      flush();
    }
  }, 1000);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !beacon.sections.includes(entry.target.id)) beacon.sections.push(entry.target.id);
      }
    },
    // Talt som sett når seksjonen krysser midten av skjermen. En terskel i
    // prosent ville aldri slått inn for seksjoner høyere enn skjermen.
    { rootMargin: "-45% 0px -45% 0px" },
  );
  for (const id of SECTIONS) {
    const node = document.getElementById(id);
    if (node) observer.observe(node);
  }

  const inputs = ["pointermove", "pointerdown", "keydown", "touchstart", "wheel"] as const;
  for (const name of inputs) window.addEventListener(name, onInput, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick, true);
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", flush);

  return () => {
    // Navigasjon innad i appen: den gamle visningen avsluttes og sendes.
    flush();
    window.clearInterval(ticker);
    observer.disconnect();
    for (const name of inputs) window.removeEventListener(name, onInput);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", flush);
  };
}
