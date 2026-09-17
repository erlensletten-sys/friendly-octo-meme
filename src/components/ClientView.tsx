"use client";

import { useState } from "react";
import CommentPanel from "./CommentPanel";
import CompareBoard from "./CompareBoard";
import DeviceBar from "./DeviceBar";
import PreviewFrame from "./PreviewFrame";
import { btnGhost } from "./ui";
import { deviceById, type Comment, type DeviceId, type Preview, type Share } from "@/lib/types";

/** Visningen kunden får. Ingen opplasting, sletting eller andre prosjekter. */
export default function ClientView({
  share,
  previews,
  comments,
}: {
  share: Share;
  previews: Preview[];
  comments: Record<string, Comment[]>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceId>("desktop");
  const open = previews.find((preview) => preview.id === openId) ?? null;

  const intro = (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <h1 className="text-xl font-semibold tracking-tight">{share.title}</h1>
      {share.intro && (
        <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-mist-300">{share.intro}</p>
      )}
    </div>
  );

  if (share.layout === "compare") {
    return (
      <div className="flex h-screen flex-col">
        <div className="border-b border-ink-700 bg-ink-900">{intro}</div>
        <CompareBoard
          available={previews}
          initialIds={share.previewIds}
          allowPicker={false}
          footerFor={(preview) => (
            <CommentPanel
              previewId={preview.id}
              shareToken={share.token}
              initial={comments[preview.id] ?? []}
              canPost={share.allowComments}
              compact
            />
          )}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-ink-700 bg-ink-900">{intro}</div>

      <main className="mx-auto grid max-w-[1600px] gap-6 px-5 py-6 sm:grid-cols-2 xl:grid-cols-3">
        {previews.map((preview) => (
          <article key={preview.id} className="panel overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(preview.id)}
              className="block w-full text-left"
            >
              <PreviewFrame
                preview={preview}
                width={1440}
                mode="thumb"
                className="aspect-[16/10] w-full"
              />
            </button>
            <div className="space-y-3 p-4">
              <div>
                <h2 className="text-sm font-medium">{preview.title}</h2>
                {preview.note && <p className="mt-1 text-xs text-mist-400">{preview.note}</p>}
              </div>
              <button
                type="button"
                className={`${btnGhost} w-full`}
                onClick={() => setOpenId(preview.id)}
              >
                Se i full størrelse
              </button>
              <CommentPanel
                previewId={preview.id}
                shareToken={share.token}
                initial={comments[preview.id] ?? []}
                canPost={share.allowComments}
                compact
              />
            </div>
          </article>
        ))}
      </main>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink-950">
          <header className="flex flex-wrap items-center gap-3 border-b border-ink-700 px-5 py-3">
            <span className="text-sm font-medium">{open.title}</span>
            <div className="flex-1" />
            <DeviceBar value={device} onChange={setDevice} />
            <button type="button" className={btnGhost} onClick={() => setOpenId(null)}>
              Lukk
            </button>
          </header>
          <div className="min-h-0 flex-1 bg-ink-900 p-4">
            <div className="mx-auto h-full" style={{ maxWidth: deviceById(device).width }}>
              <PreviewFrame
                preview={open}
                width={deviceById(device).width}
                className="h-full w-full rounded-xl border border-ink-700"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
