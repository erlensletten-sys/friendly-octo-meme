"use client";

import { useState } from "react";
import { btnGhost, btnPrimary } from "./ui";

export default function ShareDialog({
  previewIds,
  onClose,
}: {
  previewIds: string[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState("Forslag til nettside");
  const [intro, setIntro] = useState("");
  const [layout, setLayout] = useState<"gallery" | "compare">(
    previewIds.length > 1 ? "compare" : "gallery",
  );
  const [allowComments, setAllowComments] = useState(true);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function create() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewIds, title, intro, layout, allowComments }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Kunne ikke lage lenken.");
      setLink(`${window.location.origin}/s/${data.share.token}`);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Kopiering ble blokkert – merk lenken manuelt.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-lg p-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-base font-semibold">Del med kunde</h2>
        <p className="mt-1 text-xs text-mist-400">
          {previewIds.length} preview{previewIds.length === 1 ? "" : "er"} i lenken. Kunden ser
          bare visningen – ingen opplasting, sletting eller andre prosjekter.
        </p>

        {link ? (
          <div className="mt-5 space-y-3">
            <div className="flex gap-2">
              <input readOnly value={link} className="field font-mono text-xs" />
              <button type="button" className={btnPrimary} onClick={copy}>
                {copied ? "Kopiert" : "Kopier"}
              </button>
            </div>
            <p className="text-[11px] text-mist-400">
              Lenken er hemmelig, men uten passord – alle som har den kan se previewene.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <a href={link} target="_blank" rel="noreferrer" className={btnGhost}>
                Åpne
              </a>
              <button type="button" className={btnPrimary} onClick={onClose}>
                Ferdig
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-mist-300">Overskrift</label>
              <input
                className="field"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-mist-300">
                Melding til kunden
              </label>
              <textarea
                className="field resize-none"
                rows={3}
                value={intro}
                onChange={(event) => setIntro(event.target.value)}
                placeholder="Her er to forslag til forsiden. Si fra hvilken retning du liker best."
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex rounded-lg border border-ink-600 bg-ink-900 p-0.5">
                {(["gallery", "compare"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLayout(option)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      layout === option
                        ? "bg-amber-brand text-ink-950"
                        : "text-mist-300 hover:text-mist-100"
                    }`}
                  >
                    {option === "gallery" ? "Galleri" : "Side ved side"}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-mist-300">
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(event) => setAllowComments(event.target.checked)}
                  className="h-3.5 w-3.5 accent-[#ffb020]"
                />
                La kunden kommentere
              </label>
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className={btnGhost} onClick={onClose}>
                Avbryt
              </button>
              <button type="button" className={btnPrimary} onClick={create} disabled={busy}>
                {busy ? "Lager lenke …" : "Lag lenke"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
