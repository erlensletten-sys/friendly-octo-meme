"use client";

import { useEffect, useState } from "react";
import DeviceBar from "./DeviceBar";
import PreviewFrame from "./PreviewFrame";
import { btnGhost, btnQuiet } from "./ui";
import { setSyncEnabled } from "@/lib/frameSync";
import { deviceById, type DeviceId, type Preview } from "@/lib/types";

const MAX_PANES = 4;

export default function CompareBoard({
  available,
  initialIds,
  allowPicker = true,
  footerFor,
}: {
  available: Preview[];
  initialIds: string[];
  /** Kundevisningen låser hvilke previews som kan vises. */
  allowPicker?: boolean;
  /** Valgfritt innhold under hvert panel, f.eks. kommentarfelt. */
  footerFor?: (preview: Preview) => React.ReactNode;
}) {
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [sync, setSync] = useState(true);
  const [paneIds, setPaneIds] = useState<string[]>(() => {
    const seeded = initialIds.filter((id) => available.some((preview) => preview.id === id));
    if (seeded.length >= 2) return seeded.slice(0, MAX_PANES);
    return available.slice(0, Math.max(2, seeded.length || 2)).map((preview) => preview.id);
  });

  useEffect(() => {
    setSyncEnabled(sync);
  }, [sync]);

  const width = deviceById(device).width;

  function setPane(index: number, id: string) {
    setPaneIds((current) => current.map((value, i) => (i === index ? id : value)));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-700 bg-ink-900 px-5 py-3">
        <DeviceBar value={device} onChange={setDevice} />
        <label className="flex items-center gap-2 text-xs text-mist-300">
          <input
            type="checkbox"
            checked={sync}
            onChange={(event) => setSync(event.target.checked)}
            className="h-3.5 w-3.5 accent-[#ffb020]"
          />
          Synkronisert scrolling
        </label>
        <div className="flex-1" />
        {allowPicker && (
          <div className="flex gap-2">
            <button
              type="button"
              className={btnQuiet}
              onClick={() => setPaneIds((current) => current.slice(0, -1))}
              disabled={paneIds.length <= 1}
            >
              Færre paneler
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() =>
                setPaneIds((current) => [
                  ...current,
                  available.find((preview) => !current.includes(preview.id))?.id ??
                    available[0].id,
                ])
              }
              disabled={paneIds.length >= MAX_PANES || available.length === 0}
            >
              Flere paneler
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 gap-px overflow-x-auto bg-ink-700">
        {paneIds.map((id, index) => {
          const preview = available.find((item) => item.id === id);
          return (
            <section
              key={`${id}-${index}`}
              className="flex min-w-[320px] flex-1 flex-col bg-ink-900"
            >
              <header className="flex items-center gap-2 border-b border-ink-700 px-3 py-2">
                {allowPicker ? (
                  <select
                    className="field !py-1 !text-xs"
                    value={id}
                    onChange={(event) => setPane(index, event.target.value)}
                  >
                    {available.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.group ? `${option.group} – ` : ""}
                        {option.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="truncate text-xs font-medium text-mist-200">
                    {preview?.title ?? "Ukjent"}
                  </span>
                )}
              </header>

              <div className="min-h-0 flex-1 p-3">
                {preview ? (
                  <PreviewFrame
                    preview={preview}
                    width={width}
                    className="h-full w-full rounded-lg border border-ink-700"
                  />
                ) : (
                  <p className="p-4 text-xs text-mist-400">Fant ikke previewen.</p>
                )}
              </div>

              {preview && footerFor && (
                <div className="max-h-72 overflow-y-auto border-t border-ink-700 bg-ink-850 p-3">
                  {footerFor(preview)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
