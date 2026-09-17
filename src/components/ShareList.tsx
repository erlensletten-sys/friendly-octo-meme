"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnQuiet, formatDate } from "./ui";
import type { Preview, Share } from "@/lib/types";

export default function ShareList({
  shares,
  previews,
  origin,
}: {
  shares: Share[];
  previews: Preview[];
  origin: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState("");

  async function copy(token: string) {
    await navigator.clipboard.writeText(`${origin}/s/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(""), 1800);
  }

  async function revoke(token: string) {
    if (!confirm("Trekke tilbake lenken? Kunden mister tilgangen med én gang.")) return;
    await fetch(`/api/shares/${encodeURIComponent(token)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <ul className="space-y-3">
      {shares.map((share) => {
        const titles = share.previewIds
          .map((id) => previews.find((preview) => preview.id === id)?.title)
          .filter(Boolean);
        return (
          <li key={share.token} className="panel flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{share.title}</p>
              <p className="truncate text-xs text-mist-400">
                {formatDate(share.createdAt)} ·{" "}
                {share.layout === "compare" ? "Side ved side" : "Galleri"} ·{" "}
                {titles.join(", ") || "Ingen previews igjen"}
              </p>
            </div>
            <code className="hidden max-w-xs truncate rounded bg-ink-900 px-2 py-1 text-[11px] text-mist-400 lg:block">
              /s/{share.token}
            </code>
            <div className="flex gap-1">
              <button type="button" className={btnQuiet} onClick={() => copy(share.token)}>
                {copied === share.token ? "Kopiert" : "Kopier lenke"}
              </button>
              <a
                href={`/s/${share.token}`}
                target="_blank"
                rel="noreferrer"
                className={btnQuiet}
              >
                Åpne
              </a>
              <button type="button" className={btnQuiet} onClick={() => revoke(share.token)}>
                Trekk tilbake
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
