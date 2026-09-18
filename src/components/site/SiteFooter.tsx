"use client";

import Link from "next/link";
import { useSite } from "./SiteContext";

export default function SiteFooter() {
  const { t } = useSite();
  const { brand } = t;
  return (
    <footer className="border-t border-ink-800/80">
      <div className="mono mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-8 text-[11.5px] text-mist-400">
        <span className="flex items-center gap-2 text-mist-300">
          <span className="loop-text loop-text-animate text-base leading-none">∞</span>
          {brand.name}
        </span>
        <span>{brand.location}</span>
        {brand.orgNumber && <span>{t.footer.orgNumber} {brand.orgNumber}</span>}
        <Link href="/visningsrom" className="ml-auto hover:text-mist-100">
          {t.ui.visningsrom}
        </Link>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
