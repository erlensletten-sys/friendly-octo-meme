import Link from "next/link";
import TextEditor from "@/components/TextEditor";
import { PageHeader, btnGhost } from "@/components/ui";

export const dynamic = "force-dynamic";

/** Admin redigerer teksten på hjemmesiden, per språk. Bak passord via proxy.ts. */
export default function SiteTextPage() {
  return (
    <>
      <PageHeader
        title="Tekst på hjemmesiden"
        subtitle="Endringer vises på forsida med én gang du lagrer"
        actions={
          <Link href="/visningsrom" className={btnGhost}>
            Tilbake
          </Link>
        }
      />
      <main className="mx-auto max-w-[1100px] px-5 py-6">
        <TextEditor />
      </main>
    </>
  );
}
