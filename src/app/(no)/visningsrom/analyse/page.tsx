import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, Panel, btnGhost } from "@/components/ui";
import { SECTIONS } from "@/lib/analytics/shared";
import {
  combine,
  daySummary,
  lastDays,
  listClones,
  listVisits,
  osloDay,
  type Summary,
  type Visit,
} from "@/lib/analytics/store";
import { listShares } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analyse" };

const RANGES = [
  { days: 1, label: "I dag" },
  { days: 7, label: "7 dager" },
  { days: 30, label: "30 dager" },
  { days: 90, label: "90 dager" },
] as const;

const SECTION_LABELS: Record<(typeof SECTIONS)[number], string> = {
  tjenester: "Tjenester",
  arbeid: "Arbeid",
  prosess: "Prosess",
  kontakt: "Kontakt",
};

export default async function AnalysePage({
  searchParams,
}: {
  searchParams: Promise<{ dager?: string }>;
}) {
  const { dager } = await searchParams;
  const range = RANGES.find((item) => String(item.days) === dager) ?? RANGES[1];
  const today = osloDay();
  const days = lastDays(range.days);

  const [perDay, clones, shares] = await Promise.all([
    Promise.all(days.map((day) => daySummary(day, today))),
    listClones(),
    listShares(),
  ]);

  const total = combine(perDay.map((item) => item.summary));
  // Dagens besøk er alltid lest rått (dagen er ikke over), så de siste
  // besøkene kan vises uten et ekstra oppslag.
  const todays = perDay.at(-1)?.visits ?? (await listVisits(today));
  const recent = [...todays].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 25);
  const activeNow = new Set(
    todays.filter((visit) => Date.now() - Date.parse(visit.updatedAt) < 30 * 60_000).map((visit) => visit.visitor),
  ).size;

  const shareTitles = new Map(shares.map((share) => [share.token, share.title]));
  const pageName = (path: string) => {
    const token = /^\/s\/([^/]+)/.exec(path)?.[1];
    if (token) return `Kundelenke: ${shareTitles.get(token) ?? "slettet"}`;
    return path;
  };

  const homeViews = total.pages["/"]?.views ?? 0;

  return (
    <>
      <PageHeader
        title="Analyse"
        subtitle={`Besøk, engasjement og klikk · ${range.label.toLowerCase()}`}
        actions={
          <>
            <nav className="flex rounded-lg border border-ink-600 p-0.5" aria-label="Periode">
              {RANGES.map((item) => (
                <Link
                  key={item.days}
                  href={`/visningsrom/analyse?dager=${item.days}`}
                  aria-current={item.days === range.days ? "page" : undefined}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs transition-colors ${
                    item.days === range.days
                      ? "bg-amber-brand font-medium text-ink-950"
                      : "text-mist-300 hover:bg-ink-800 hover:text-mist-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link href="/visningsrom" className={btnGhost}>
              Previews
            </Link>
          </>
        }
      />

      <main className="mx-auto max-w-[1600px] space-y-6 px-5 py-6">
        {clones.length > 0 && <CloneAlert clones={clones} />}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Nøkkeltall">
          <Stat label="Besøkende" value={fmtInt(total.visitors)} note={range.days > 1 ? "unike per dag, summert" : "unike i dag"} />
          <Stat label="Sidevisninger" value={fmtInt(total.pageviews)} note={`${fmtInt(activeNow)} aktive siste 30 min`} />
          <Stat label="Aktiv tid per visning" value={fmtDuration(avg(total.activeMs, total.pageviews))} note="fanen synlig og noen til stede" />
          <Stat label="Engasjerte visninger" value={fmtPct(total.engaged, total.pageviews)} note="10 s aktiv eller et klikk" />
          <Stat label="Scrolldybde" value={total.pageviews ? `${Math.round(total.scrollSum / total.pageviews)} %` : "–"} note="snitt, dypeste punkt" />
          <Stat label="Klikk" value={fmtInt(total.clickCount)} note={`${(total.pageviews ? total.clickCount / total.pageviews : 0).toFixed(1)} per visning`} />
        </section>

        {total.pageviews === 0 ? (
          <EmptyState
            title="Ingen besøk i perioden"
            body="Målingen starter når noen åpner hjemmesiden eller en kundelenke. Dine egne besøk mens du er logget inn telles ikke."
          />
        ) : (
          <>
            {range.days > 1 && <DailyChart days={perDay.map((item) => item.summary)} />}

            <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
              <RankPanel
                title="Sider"
                caption="Visninger · snitt aktiv tid"
                rows={Object.entries(total.pages).map(([path, page]) => ({
                  label: pageName(path),
                  value: page.views,
                  extra: fmtDuration(avg(page.activeMs, page.views)),
                }))}
              />
              <RankPanel
                title="Klikk"
                caption="Knapper og lenker, flest først"
                rows={Object.values(total.clicks).map((click) => ({
                  label: click.label,
                  sub: click.href || undefined,
                  value: click.count,
                }))}
              />
              <Panel className="p-5">
                <PanelHead title="Seksjoner sett" caption={`Andel av ${fmtInt(homeViews)} visninger av forsiden`} />
                <ul className="mt-4 space-y-3">
                  {SECTIONS.map((section) => {
                    const seen = total.sections[section] ?? 0;
                    return (
                      <Bar
                        key={section}
                        label={SECTION_LABELS[section]}
                        value={seen}
                        max={homeViews}
                        display={fmtPct(seen, homeViews)}
                      />
                    );
                  })}
                </ul>
                <p className="mt-4 text-xs text-mist-400">
                  Faller andelen brått mellom to seksjoner, er det der folk slutter å lese.
                </p>
              </Panel>
              <RankPanel
                title="Kilder"
                caption="Hvor besøkene kom fra"
                rows={Object.entries(total.referrers).map(([label, value]) => ({ label, value }))}
              />
              {Object.keys(total.campaigns).length > 0 && (
                <RankPanel
                  title="Kampanjer"
                  caption="utm_source / medium / campaign"
                  rows={Object.entries(total.campaigns).map(([label, value]) => ({ label, value }))}
                />
              )}
              <RankPanel
                title="Land"
                caption="Fra IP-oppslaget til Vercel"
                rows={Object.entries(total.countries).map(([code, value]) => ({ label: countryName(code), value }))}
              />
              <Panel className="p-5">
                <PanelHead title="Enheter og nettlesere" caption="Andel av visningene" />
                <ul className="mt-4 space-y-3">
                  {sorted(total.devices).map(([label, value]) => (
                    <Bar key={label} label={capitalize(label)} value={value} max={total.pageviews} display={fmtPct(value, total.pageviews)} />
                  ))}
                </ul>
                <ul className="mt-5 space-y-3 border-t border-ink-700 pt-5">
                  {sorted(total.browsers).slice(0, 6).map(([label, value]) => (
                    <Bar key={label} label={label} value={value} max={total.pageviews} display={fmtPct(value, total.pageviews)} />
                  ))}
                </ul>
              </Panel>
            </div>
          </>
        )}

        <RecentVisits visits={recent} pageName={pageName} />

        <p className="text-xs text-mist-400">
          Ingen cookies og ingen tredjepart. IP-adresser lagres ikke; de brukes bare til en hash som
          byttes hvert døgn, så samme besøkende telles én gang per dag. Roboter og dine egne besøk
          mens du er logget inn er holdt utenfor.
        </p>
      </main>
    </>
  );
}

/* ------------------------------------------------------------ byggeklosser */

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Panel className="p-4">
      <p className="text-xs text-mist-400">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-mist-100 tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] text-mist-400">{note}</p>
    </Panel>
  );
}

function PanelHead({ title, caption }: { title: string; caption: string }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-mist-100">{title}</h2>
      <p className="text-xs text-mist-400">{caption}</p>
    </div>
  );
}

/** Vannrett stolpe. Tallet står i teksttoken ved siden av, fargen bærer bare lengden. */
function Bar({
  label,
  sub,
  value,
  max,
  display,
}: {
  label: string;
  sub?: string;
  value: number;
  max: number;
  display: string;
}) {
  const width = max > 0 ? Math.max(1.5, (value / max) * 100) : 0;
  return (
    <li className="group" title={`${label}${sub ? ` → ${sub}` : ""}: ${display}`}>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="min-w-0 truncate text-mist-200">{label}</span>
        <span className="shrink-0 text-mist-300 tabular-nums">{display}</span>
      </div>
      {sub && <p className="mono truncate text-[11px] text-mist-400">{sub}</p>}
      <div className="mt-1.5 h-1.5 rounded-full bg-ink-800">
        <div
          className="h-full rounded-full bg-amber-brand/80 transition-colors group-hover:bg-amber-brand"
          style={{ width: `${width}%` }}
        />
      </div>
    </li>
  );
}

function RankPanel({
  title,
  caption,
  rows,
  limit = 8,
}: {
  title: string;
  caption: string;
  rows: { label: string; sub?: string; value: number; extra?: string }[];
  limit?: number;
}) {
  const ordered = [...rows].sort((a, b) => b.value - a.value);
  const shown = ordered.slice(0, limit);
  const rest = ordered.slice(limit).reduce((sum, row) => sum + row.value, 0);
  const max = shown[0]?.value ?? 0;
  return (
    <Panel className="p-5">
      <PanelHead title={title} caption={caption} />
      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-mist-400">Ingenting registrert ennå.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((row) => (
            <Bar
              key={`${row.label}|${row.sub ?? ""}`}
              label={row.label}
              sub={row.sub}
              value={row.value}
              max={max}
              display={row.extra ? `${fmtInt(row.value)} · ${row.extra}` : fmtInt(row.value)}
            />
          ))}
        </ul>
      )}
      {rest > 0 && <p className="mt-3 text-xs text-mist-400">+ {fmtInt(rest)} til i andre rader</p>}
    </Panel>
  );
}

/** Besøkende per dag. Én serie, én akse; sidevisningene står i verktøytipset. */
function DailyChart({ days }: { days: (Summary & { day: string })[] }) {
  const max = Math.max(1, ...days.map((day) => day.visitors));
  const dense = days.length > 31;
  return (
    <Panel className="p-5">
      <PanelHead title="Besøkende per dag" caption="Pek på en stolpe for detaljer" />
      <div className="relative mt-5">
        <span className="absolute -top-1 left-0 text-[11px] text-mist-400 tabular-nums">{fmtInt(max)}</span>
        <div
          className={`flex h-44 items-end border-b border-ink-600 pt-5 ${dense ? "gap-px" : "gap-0.5"}`}
          role="list"
        >
          {days.map((day, index) => {
            const height = (day.visitors / max) * 100;
            // Tipset forankres mot midten av grafen, så det aldri stikker ut
            // av skjermen ved første eller siste stolpe.
            const third = index / Math.max(1, days.length - 1);
            const anchor = third < 0.25 ? "left-0" : third > 0.75 ? "right-0" : "left-1/2 -translate-x-1/2";
            return (
              <div key={day.day} role="listitem" className="group relative flex h-full min-w-0 flex-1 items-end">
                {/* Treffflaten er hele søylen, ikke bare stolpen, så lave dager kan pekes på. */}
                <div
                  className="w-full rounded-t-[4px] bg-amber-brand/75 transition-colors group-hover:bg-amber-brand"
                  style={{ height: `${Math.max(day.visitors ? 2 : 0, height)}%` }}
                />
                <div className={`pointer-events-none absolute bottom-full ${anchor} z-10 mb-2 w-max rounded-md border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-[11px] opacity-0 shadow-lg transition-opacity group-hover:opacity-100`}>
                  <p className="font-medium text-mist-100">{fmtDay(day.day)}</p>
                  <p className="text-mist-300 tabular-nums">
                    {fmtInt(day.visitors)} besøkende · {fmtInt(day.pageviews)} visninger
                  </p>
                  <p className="text-mist-400 tabular-nums">
                    {fmtDuration(avg(day.activeMs, day.pageviews))} aktiv · {fmtInt(day.clickCount)} klikk
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-mist-400">
          <span>{fmtDay(days[0].day)}</span>
          <span>{fmtDay(days[days.length - 1].day)}</span>
        </div>
      </div>
      <details className="mt-4 text-xs text-mist-400">
        <summary className="cursor-pointer hover:text-mist-200">Vis som tabell</summary>
        <table className="mt-3 w-full text-left tabular-nums">
          <thead className="text-mist-400">
            <tr>
              <th className="py-1 font-normal">Dag</th>
              <th className="py-1 font-normal">Besøkende</th>
              <th className="py-1 font-normal">Visninger</th>
              <th className="py-1 font-normal">Snitt aktiv</th>
              <th className="py-1 font-normal">Klikk</th>
            </tr>
          </thead>
          <tbody className="text-mist-200">
            {[...days].reverse().map((day) => (
              <tr key={day.day} className="border-t border-ink-800">
                <td className="py-1">{fmtDay(day.day)}</td>
                <td className="py-1">{fmtInt(day.visitors)}</td>
                <td className="py-1">{fmtInt(day.pageviews)}</td>
                <td className="py-1">{fmtDuration(avg(day.activeMs, day.pageviews))}</td>
                <td className="py-1">{fmtInt(day.clickCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Panel>
  );
}

function RecentVisits({ visits, pageName }: { visits: Visit[]; pageName: (path: string) => string }) {
  return (
    <Panel className="overflow-hidden">
      <div className="p-5 pb-3">
        <PanelHead title="Siste besøk i dag" caption="Nyeste først · oppdateres når siden lastes på nytt" />
      </div>
      {visits.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-mist-400">Ingen besøk i dag ennå.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="text-xs text-mist-400">
              <tr className="border-y border-ink-700">
                <th className="px-5 py-2 font-normal">Tid</th>
                <th className="px-3 py-2 font-normal">Side</th>
                <th className="px-3 py-2 font-normal">Kilde</th>
                <th className="px-3 py-2 font-normal">Enhet</th>
                <th className="px-3 py-2 font-normal">Aktiv</th>
                <th className="px-3 py-2 font-normal">Scroll</th>
                <th className="px-5 py-2 font-normal">Klikk</th>
              </tr>
            </thead>
            <tbody className="text-mist-200">
              {visits.map((visit) => (
                <tr key={visit.id} className="border-b border-ink-800 align-top last:border-0">
                  <td className="px-5 py-2 text-mist-300 tabular-nums">{fmtTime(visit.startedAt)}</td>
                  <td className="max-w-[260px] truncate px-3 py-2">{pageName(visit.path)}</td>
                  <td className="px-3 py-2 text-mist-300">{visit.referrer}</td>
                  <td className="px-3 py-2 text-mist-300">
                    {capitalize(visit.device)} · {visit.browser}
                    {visit.country !== "??" && ` · ${visit.country}`}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{fmtDuration(visit.activeMs)}</td>
                  <td className="px-3 py-2 tabular-nums">{visit.scroll} %</td>
                  <td className="max-w-[320px] px-5 py-2 text-mist-300">
                    {visit.clicks.length === 0
                      ? "–"
                      : visit.clicks.map((click) => click.label).slice(0, 4).join(" → ") +
                        (visit.clicks.length > 4 ? ` (+${visit.clicks.length - 4})` : "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function CloneAlert({ clones }: { clones: Awaited<ReturnType<typeof listClones>> }) {
  return (
    <Panel className="border-red-500/50 p-5" role="alert">
      <PanelHead
        title={`Sida kjører på ${clones.length === 1 ? "et domene" : `${clones.length} domener`} som ikke er ditt`}
        caption="Kopien meldte fra og sendte den besøkende videre til originalen"
      />
      <ul className="mt-4 divide-y divide-ink-800 text-[13px]">
        {clones.map((clone) => (
          <li key={clone.host} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2">
            <span className="mono font-medium text-red-300">{clone.host}</span>
            <span className="text-mist-300 tabular-nums">{fmtInt(clone.count)} treff</span>
            <span className="text-mist-400">
              først {fmtDateTime(clone.firstSeen)} · sist {fmtDateTime(clone.lastSeen)}
            </span>
            <span className="mono min-w-0 flex-1 truncate text-[11px] text-mist-400">{clone.lastHref}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------------------------------------------------------------- format */

const intFormat = new Intl.NumberFormat("nb-NO");
const fmtInt = (value: number) => intFormat.format(value);
const avg = (sum: number, count: number) => (count > 0 ? sum / count : 0);
const fmtPct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)} %` : "–");
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const sorted = (tally: Record<string, number>) => Object.entries(tally).sort((a, b) => b[1] - a[1]);

function fmtDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ${String(seconds % 60).padStart(2, "0")} s`;
}

function fmtDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("nb-NO", { day: "numeric", month: "short", timeZone: "Europe/Oslo" });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo" });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("nb-NO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
}

const regionNames = new Intl.DisplayNames(["nb"], { type: "region" });
function countryName(code: string): string {
  if (code === "??") return "Ukjent";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}
