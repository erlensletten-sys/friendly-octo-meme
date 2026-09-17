"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DeviceBar from "./DeviceBar";
import PreviewCard from "./PreviewCard";
import ShareDialog from "./ShareDialog";
import UploadPanel from "./UploadPanel";
import { EmptyState, PageHeader, btnGhost, btnPrimary } from "./ui";
import type { DeviceId, Preview } from "@/lib/types";

export default function Gallery({
  previews,
  directUpload,
  maxUploadMb,
}: {
  previews: Preview[];
  directUpload: boolean;
  maxUploadMb: number;
}) {
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sharing, setSharing] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return previews;
    return previews.filter((preview) =>
      [preview.title, preview.group, preview.note, preview.url ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [previews, query]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <>
      <PageHeader
        title="Alle previews"
        subtitle={`${previews.length} lagret`}
        actions={
          <>
            <input
              className="field !w-48 !py-1.5"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Søk …"
            />
            <DeviceBar value={device} onChange={setDevice} compact />
            <Link href="/visningsrom/shares" className={btnGhost}>
              Delte lenker
            </Link>
          </>
        }
      />

      <main className="mx-auto max-w-[1600px] space-y-6 px-5 py-6">
        <UploadPanel directUpload={directUpload} maxUploadMb={maxUploadMb} />

        {previews.length === 0 ? (
          <EmptyState
            title="Ingen previews ennå"
            body="Last opp en .html-fil eller en .zip-pakke over, eller pek på en adresse som allerede er publisert. Hver opplasting blir en preview du kan åpne, sammenligne og dele."
          />
        ) : visible.length === 0 ? (
          <EmptyState title="Ingen treff" body="Prøv et annet søkeord." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visible.map((preview) => (
              <PreviewCard
                key={preview.id}
                preview={preview}
                device={device}
                selected={selected.includes(preview.id)}
                onToggle={toggle}
              />
            ))}
          </div>
        )}
      </main>

      {selected.length > 0 && (
        <div className="sticky bottom-0 z-40 border-t border-ink-700 bg-ink-900/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-5 py-3">
            <span className="text-sm text-mist-200">
              {selected.length} valgt
            </span>
            <button
              type="button"
              className={`${btnGhost} !px-2 !py-1 !text-xs`}
              onClick={() => setSelected([])}
            >
              Nullstill
            </button>
            <div className="flex-1" />
            <Link
              href={`/visningsrom/compare?ids=${selected.slice(0, 4).join(",")}`}
              className={btnGhost}
              aria-disabled={selected.length < 2}
            >
              Sammenlign side ved side
            </Link>
            <button type="button" className={btnPrimary} onClick={() => setSharing(true)}>
              Del med kunde
            </button>
          </div>
        </div>
      )}

      {sharing && <ShareDialog previewIds={selected} onClose={() => setSharing(false)} />}
    </>
  );
}
