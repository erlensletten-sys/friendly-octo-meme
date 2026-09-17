"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PreviewFrame from "./PreviewFrame";
import { btnQuiet, formatBytes, formatDate } from "./ui";
import { deviceById, type DeviceId, type Preview } from "@/lib/types";

export default function PreviewCard({
  preview,
  device,
  selected,
  onToggle,
}: {
  preview: Preview;
  device: DeviceId;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(preview.title);
  const [busy, setBusy] = useState(false);

  async function save() {
    setEditing(false);
    if (title.trim() === preview.title) return;
    setBusy(true);
    await fetch(`/api/previews/${preview.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Slette "${preview.title}"? Dette kan ikke angres.`)) return;
    setBusy(true);
    await fetch(`/api/previews/${preview.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <article
      className={`panel group overflow-hidden transition-colors ${
        selected ? "border-amber-brand" : ""
      } ${busy ? "opacity-50" : ""}`}
    >
      <div className="relative">
        <Link href={`/visningsrom/preview/${preview.id}`} className="block">
          <PreviewFrame
            preview={preview}
            width={deviceById(device).width}
            mode="thumb"
            className="aspect-[16/10] w-full"
          />
        </Link>

        <label
          className="absolute left-3 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-ink-600 bg-ink-900/90 backdrop-blur"
          title="Velg for sammenligning eller deling"
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(preview.id)}
            className="h-3.5 w-3.5 accent-[#ffb020]"
          />
        </label>

        {preview.kind === "url" && (
          <span className="absolute right-3 top-3 rounded-md bg-ink-900/90 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-mist-300 backdrop-blur">
            Live
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        {editing ? (
          <input
            autoFocus
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
              if (event.key === "Escape") {
                setTitle(preview.title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => setEditing(true)}
            className="block w-full truncate text-left text-sm font-medium text-mist-100"
            title="Dobbeltklikk for å endre navn"
          >
            {preview.title}
          </button>
        )}

        <p className="truncate text-xs text-mist-400">
          {[preview.group, preview.note].filter(Boolean).join(" · ") || "Ingen beskrivelse"}
        </p>

        <div className="flex items-center justify-between pt-1 text-[11px] text-mist-400">
          <span>
            {formatDate(preview.createdAt)}
            {preview.kind === "bundle" && ` · ${formatBytes(preview.size)}`}
          </span>
          <span className="hover-reveal flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Link href={`/visningsrom/preview/${preview.id}`} className={`${btnQuiet} !px-2 !py-1`}>
              Åpne
            </Link>
            <button type="button" onClick={remove} className={`${btnQuiet} !px-2 !py-1`}>
              Slett
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}
