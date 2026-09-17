"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { btnGhost } from "./ui";
import { buildUploadPathname, randomUploadId } from "@/lib/uploadPath";
import type { Preview } from "@/lib/types";

type Progress = { name: string; percentage: number; state: "laster" | "pakker" | "ferdig" | "feil" };
type Failure = { name: string; reason: string };

export default function UploadPanel({
  directUpload,
  maxUploadMb,
}: {
  /** Sant når Vercel Blob er koblet til, og fila kan gå rett fra nettleseren. */
  directUpload: boolean;
  maxUploadMb: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [group, setGroup] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");

  const maxBytes = maxUploadMb * 1024 * 1024;

  function update(name: string, patch: Partial<Progress>) {
    setProgress((current) =>
      current.map((item) => (item.name === name ? { ...item, ...patch } : item)),
    );
  }

  function report(created: number, failed: Failure[]) {
    setMessage({
      tone: failed.length ? "error" : "ok",
      text: failed.length
        ? `${created} lagt til. Hoppet over: ${failed
            .map((item) => `${item.name} (${item.reason})`)
            .join(", ")}`
        : `${created} preview${created === 1 ? "" : "er"} lagt til.`,
    });
    if (created > 0) router.refresh();
  }

  /**
   * Direkte opplasting: fila går fra nettleseren rett til blob-lageret, og
   * serveren får bare beskjed om hvor den havnet. Da slipper vi grensen på
   * ca. 4,5 MB per request på Vercel.
   */
  async function uploadDirect(file: File): Promise<Preview> {
    const { upload } = await import("@vercel/blob/client");
    const name = file.name.toLowerCase();
    const contentType = name.endsWith(".zip")
      ? "application/zip"
      : name.endsWith(".html") || name.endsWith(".htm")
        ? "text/html"
        : file.type || "application/octet-stream";

    const blob = await upload(buildUploadPathname(file.name, randomUploadId()), file, {
      access: "private",
      contentType,
      handleUploadUrl: "/api/previews/client-token",
      // Store filer deles opp og lastes opp i parallell, med gjenforsøk per del.
      multipart: file.size > 8 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => update(file.name, { percentage }),
    });

    update(file.name, { percentage: 100, state: "pakker" });

    const response = await fetch("/api/previews/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pathname: blob.pathname,
        fileName: file.name,
        group,
        note,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Utpakkingen feilet.");
    return data.previews[0] as Preview;
  }

  /** Opplasting gjennom vår egen server. Brukes lokalt og på egen server. */
  async function uploadThroughServer(files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append("file", file));
    form.set("group", group);
    form.set("note", note);

    const response = await fetch("/api/previews", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Opplastingen feilet.");
    return { created: data.previews.length as number, failed: (data.failed ?? []) as Failure[] };
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const all = Array.from(fileList);
    if (all.length === 0) return;

    const tooBig = all.filter((file) => file.size > maxBytes);
    const files = all.filter((file) => file.size <= maxBytes && file.size > 0);
    const failed: Failure[] = [
      ...tooBig.map((file) => ({ name: file.name, reason: `Over ${maxUploadMb} MB.` })),
      ...all.filter((file) => file.size === 0).map((file) => ({ name: file.name, reason: "Tom fil." })),
    ];

    setBusy(true);
    setMessage(null);
    setProgress(files.map((file) => ({ name: file.name, percentage: 0, state: "laster" })));

    let created = 0;
    try {
      if (directUpload) {
        for (const file of files) {
          try {
            await uploadDirect(file);
            update(file.name, { state: "ferdig" });
            created++;
          } catch (error) {
            update(file.name, { state: "feil" });
            failed.push({ name: file.name, reason: (error as Error).message });
          }
        }
      } else if (files.length > 0) {
        const result = await uploadThroughServer(files);
        created = result.created;
        failed.push(...result.failed);
        setProgress((current) => current.map((item) => ({ ...item, percentage: 100, state: "ferdig" })));
      }
      report(created, failed);
    } catch (error) {
      setMessage({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
      setTimeout(() => setProgress([]), 1200);
    }
  }

  async function addUrl() {
    if (!url.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("url", url.trim());
      form.set("group", group);
      form.set("note", note);
      const response = await fetch("/api/previews", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Kunne ikke legge til adressen.");
      setUrl("");
      report(data.previews.length, []);
    } catch (error) {
      setMessage({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) void uploadFiles(event.dataTransfer.files);
  }

  return (
    <section className="panel p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !busy && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging
              ? "border-amber-brand bg-amber-brand/5"
              : "border-ink-600 hover:border-ink-500 hover:bg-ink-800/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".html,.htm,.zip,text/html,application/zip"
            className="hidden"
            onChange={(event) => {
              if (event.target.files) void uploadFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <p className="text-sm font-medium text-mist-100">
            {busy ? "Laster opp …" : "Slipp filer her, eller klikk for å velge"}
          </p>
          <p className="mt-1.5 text-xs text-mist-400">
            .html for enkeltsider · .zip for hele mapper med bilder, CSS og JS · opptil{" "}
            {maxUploadMb} MB
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-mist-300">
              Firma eller prosjekt
            </label>
            <input
              className="field"
              value={group}
              onChange={(event) => setGroup(event.target.value)}
              placeholder="Sletten Gulvstøp"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-mist-300">
              Notat (vises for kunden)
            </label>
            <textarea
              className="field resize-none"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Variant A – mørk forside"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-mist-300">
              … eller legg inn en adresse
            </label>
            <div className="flex gap-2">
              <input
                className="field"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addUrl()}
                placeholder="https://slgulv.no"
              />
              <button type="button" className={btnGhost} onClick={addUrl} disabled={busy}>
                Legg til
              </button>
            </div>
          </div>
        </div>
      </div>

      {progress.length > 0 && (
        <ul className="mt-4 space-y-2">
          {progress.map((item) => (
            <li key={item.name} className="flex items-center gap-3">
              <span className="w-52 truncate text-xs text-mist-300">{item.name}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
                <span
                  className={`block h-full rounded-full transition-all duration-200 ${
                    item.state === "feil" ? "bg-red-400" : "bg-amber-brand"
                  }`}
                  style={{ width: `${Math.max(item.percentage, 4)}%` }}
                />
              </span>
              <span className="w-16 shrink-0 text-right text-[11px] text-mist-400">
                {item.state === "laster"
                  ? `${Math.round(item.percentage)} %`
                  : item.state === "pakker"
                    ? "pakker ut"
                    : item.state === "ferdig"
                      ? "ferdig"
                      : "feilet"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-xs ${
            message.tone === "ok"
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </p>
      )}

      <p className="mt-3 text-[11px] text-mist-400">
        {directUpload
          ? "Filer går rett fra nettleseren til blob-lageret, så store ZIP-pakker er ikke begrenset av serveren. "
          : "Filer lastes opp gjennom serveren. "}
        Opplastede sider kjøres i sandkasse og kan ikke lese noe fra Visningsrom. Eksterne adresser
        kan blokkere innbygging – da vises de tomt, og du må åpne dem i egen fane.
      </p>
    </section>
  );
}
