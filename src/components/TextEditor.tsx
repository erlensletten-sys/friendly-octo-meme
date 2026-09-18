"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LOCALES, type Locale } from "@/lib/site/content";
import { LOCALE_LABELS, SECTION_LABELS, type TextField, type TextOverrides } from "@/lib/site/overrides";
import { btnGhost, btnPrimary, btnQuiet } from "./ui";

/**
 * Redigering av teksten på hjemmesiden. Hvert felt viser standardteksten fra
 * koden som plassholder; det admin skriver lagres som overstyring. Tomt felt
 * = standardtekst. Ett språk om gangen, lagres samlet.
 */

type Loaded = { fields: TextField[]; overrides: TextOverrides };

export default function TextEditor() {
  const [locale, setLocale] = useState<Locale>("nb");
  const [data, setData] = useState<Record<Locale, Loaded | null>>({ nb: null, en: null });
  const [draft, setDraft] = useState<TextOverrides>({});
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "busy"; text: string } | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async (loc: Locale) => {
    const res = await fetch(`/api/site-text?locale=${loc}`);
    if (!res.ok) throw new Error("Kunne ikke hente teksten.");
    const json = (await res.json()) as Loaded;
    setData((prev) => ({ ...prev, [loc]: json }));
    return json;
  }, []);

  useEffect(() => {
    load(locale)
      .then((json) => {
        setDraft(json.overrides);
        setDirty(false);
      })
      .catch((e: Error) => setStatus({ kind: "err", text: e.message }));
  }, [locale, load]);

  const loaded = data[locale];

  const sections = useMemo(() => {
    if (!loaded) return [];
    const q = filter.trim().toLowerCase();
    const groups = new Map<string, TextField[]>();
    for (const field of loaded.fields) {
      if (q && !(field.path.toLowerCase().includes(q) || field.value.toLowerCase().includes(q) || (draft[field.path] ?? "").toLowerCase().includes(q))) continue;
      const top = field.path.split(".")[0];
      if (!groups.has(top)) groups.set(top, []);
      groups.get(top)!.push(field);
    }
    return [...groups.entries()];
  }, [loaded, filter, draft]);

  const changed = Object.keys(draft).length;

  async function save() {
    setStatus({ kind: "busy", text: "Lagrer …" });
    try {
      const res = await fetch("/api/site-text", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, overrides: draft }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; overrides?: TextOverrides; count?: number };
      if (!res.ok) throw new Error(json.error ?? "Lagring feilet.");
      setDraft(json.overrides ?? {});
      setData((prev) => (prev[locale] ? { ...prev, [locale]: { ...prev[locale]!, overrides: json.overrides ?? {} } } : prev));
      setDirty(false);
      setStatus({ kind: "ok", text: `Lagret. ${json.count ?? 0} felt er endret fra standard.` });
    } catch (e) {
      setStatus({ kind: "err", text: (e as Error).message });
    }
  }

  function set(path: string, value: string, standard: string) {
    setDraft((prev) => {
      const next = { ...prev };
      if (value === "" || value === standard) delete next[path];
      else next[path] = value;
      return next;
    });
    setDirty(true);
  }

  function switchLocale(next: Locale) {
    if (dirty && !window.confirm("Du har ulagrede endringer. Bytte språk likevel?")) return;
    setLocale(next);
    setStatus(null);
  }

  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <div className="flex rounded-lg border border-ink-600 p-0.5">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => switchLocale(loc)}
              className={`rounded-md px-3 py-1.5 text-sm ${loc === locale ? "bg-amber-brand text-ink-950 font-medium" : "text-mist-300 hover:text-mist-100"}`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
        <input
          className="field max-w-xs"
          placeholder="Søk i felt …"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="ml-auto flex items-center gap-3">
          {status && (
            <span className={`text-sm ${status.kind === "err" ? "text-red-300" : "text-mist-400"}`}>{status.text}</span>
          )}
          <span className="text-xs text-mist-400">{changed} endret</span>
          <button type="button" onClick={save} disabled={!dirty || status?.kind === "busy"} className={btnPrimary}>
            Lagre {LOCALE_LABELS[locale].toLowerCase()}
          </button>
        </div>
      </div>

      <p className="text-xs text-mist-400">
        Tomt felt betyr standardteksten som står i koden (vist grått). Skriv noe eget for å overstyre den.
        Endringer i den ene oversettelsen påvirker ikke den andre – husk å oppdatere begge.
      </p>

      {!loaded && <p className="text-sm text-mist-400">Henter …</p>}

      {sections.map(([top, fields]) => (
        <section key={top} className="panel p-5">
          <h2 className="mb-4 text-sm font-semibold text-mist-200">
            {SECTION_LABELS[top] ?? top}
            <span className="ml-2 font-normal text-mist-500">{fields.length}</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => {
              const current = draft[field.path] ?? "";
              const overridden = field.path in draft;
              const common = {
                className: `field ${field.long ? "min-h-[96px]" : ""} ${overridden ? "border-amber-brand/60" : ""}`,
                value: current,
                placeholder: field.value,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(field.path, e.target.value, field.value),
              };
              return (
                <label key={field.path} className={`block ${field.long ? "md:col-span-2" : ""}`}>
                  <span className="mono mb-1 flex items-center gap-2 text-[11px] text-mist-400">
                    {field.path}
                    {overridden && (
                      <button
                        type="button"
                        onClick={() => set(field.path, "", field.value)}
                        className={`${btnQuiet} !px-1.5 !py-0 text-[11px]`}
                        title="Tilbake til standardteksten"
                      >
                        tilbakestill
                      </button>
                    )}
                  </span>
                  {field.long ? <textarea rows={3} {...common} /> : <input {...common} />}
                </label>
              );
            })}
          </div>
        </section>
      ))}

      {loaded && (
        <div className="flex justify-end">
          <button type="button" onClick={save} disabled={!dirty || status?.kind === "busy"} className={btnGhost}>
            Lagre {LOCALE_LABELS[locale].toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}
