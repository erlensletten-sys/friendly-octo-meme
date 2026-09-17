"use client";

import Link from "next/link";
import { useState } from "react";
import DeviceBar from "./DeviceBar";
import PreviewFrame from "./PreviewFrame";
import CommentPanel from "./CommentPanel";
import { PageHeader, btnGhost, formatBytes } from "./ui";
import { deviceById, type DeviceId, type Comment, type Preview } from "@/lib/types";

export default function SinglePreview({
  preview,
  comments,
}: {
  preview: Preview;
  comments: Comment[];
}) {
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [showPanel, setShowPanel] = useState(true);
  const current = deviceById(device);
  const openUrl = preview.kind === "url" ? preview.url! : `/serve/${preview.id}`;

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title={preview.title}
        subtitle={[preview.group, `${current.width} px`].filter(Boolean).join(" · ")}
        actions={
          <>
            <DeviceBar value={device} onChange={setDevice} />
            <a href={openUrl} target="_blank" rel="noreferrer" className={btnGhost}>
              Åpne i fane
            </a>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setShowPanel((value) => !value)}
            >
              {showPanel ? "Skjul detaljer" : "Vis detaljer"}
            </button>
            <Link href="/visningsrom" className={btnGhost}>
              Tilbake
            </Link>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 bg-ink-900 p-4">
          <div className="mx-auto h-full" style={{ maxWidth: current.width }}>
            <PreviewFrame
              preview={preview}
              width={current.width}
              className="h-full w-full rounded-xl border border-ink-700"
            />
          </div>
        </div>

        {showPanel && (
          <aside className="w-80 shrink-0 space-y-4 overflow-y-auto border-l border-ink-700 bg-ink-850 p-4">
            <div className="space-y-1.5 text-xs text-mist-400">
              <p>
                <span className="text-mist-200">Type:</span>{" "}
                {preview.kind === "url" ? "Ekstern adresse" : "Opplastet pakke"}
              </p>
              {preview.kind === "url" && (
                <p className="break-all">
                  <span className="text-mist-200">Adresse:</span> {preview.url}
                </p>
              )}
              {preview.kind === "bundle" && (
                <>
                  <p>
                    <span className="text-mist-200">Rotfil:</span> {preview.entry}
                  </p>
                  <p>
                    <span className="text-mist-200">Filer:</span> {preview.files?.length} ·{" "}
                    {formatBytes(preview.size)}
                  </p>
                </>
              )}
              {preview.note && (
                <p className="pt-1 text-mist-300">{preview.note}</p>
              )}
            </div>

            <CommentPanel
              previewId={preview.id}
              initial={comments}
              canPost={false}
              canDelete
              compact
            />
          </aside>
        )}
      </div>
    </div>
  );
}
