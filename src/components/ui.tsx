import Link from "next/link";
import type { ComponentProps } from "react";

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
export const btnPrimary = `${btn} bg-amber-brand text-ink-950 hover:bg-[#ffc14d]`;
export const btnGhost = `${btn} border border-ink-600 text-mist-200 hover:border-ink-500 hover:bg-ink-800`;
export const btnQuiet = `${btn} text-mist-300 hover:text-mist-100 hover:bg-ink-800`;
export const btnDanger = `${btn} border border-ink-600 text-mist-300 hover:border-red-500/60 hover:text-red-300`;

export function Panel({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`panel ${className}`} {...props} />;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-5 py-4">
        <Link href="/visningsrom" className="flex items-center gap-2.5 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-brand text-ink-950 font-bold">
            V
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Visningsrom</span>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-medium text-mist-200">{title}</h1>
          {subtitle && <p className="truncate text-xs text-mist-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
        <Link
          href="/visningsrom/tekst"
          className="mono hidden rounded-md px-2 py-1.5 text-[11px] text-mist-400 hover:text-mist-100 lg:block"
          title="Rediger teksten på hjemmesiden"
        >
          Tekst
        </Link>
        <Link
          href="/"
          className="mono hidden rounded-md px-2 py-1.5 text-[11px] text-mist-400 hover:text-mist-100 lg:block"
          title="Til hjemmesiden"
        >
          ← Hjemmeside
        </Link>
      </div>
    </header>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel px-6 py-14 text-center">
      <p className="text-base font-medium text-mist-200">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-mist-400">{body}</p>
    </div>
  );
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "–";
  const units = ["B", "kB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
