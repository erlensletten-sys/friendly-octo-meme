import Link from "next/link";
import CompareBoard from "@/components/CompareBoard";
import { EmptyState, PageHeader, btnGhost } from "@/components/ui";
import { listPreviews } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const previews = await listPreviews();
  const initialIds = (ids ?? "").split(",").map((id) => id.trim()).filter(Boolean);

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Side ved side"
        subtitle="Samme enhetsbredde i alle paneler"
        actions={
          <Link href="/visningsrom" className={btnGhost}>
            Tilbake
          </Link>
        }
      />
      {previews.length === 0 ? (
        <main className="mx-auto w-full max-w-2xl px-5 py-10">
          <EmptyState
            title="Ingenting å sammenligne"
            body="Last opp minst to previews først, så kan du stille dem opp ved siden av hverandre."
          />
        </main>
      ) : (
        <CompareBoard available={previews} initialIds={initialIds} />
      )}
    </div>
  );
}
