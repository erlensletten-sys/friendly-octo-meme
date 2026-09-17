import { headers } from "next/headers";
import Link from "next/link";
import ShareList from "@/components/ShareList";
import { EmptyState, PageHeader, btnGhost } from "@/components/ui";
import { listPreviews, listShares } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SharesPage() {
  const [shares, previews, headerList] = await Promise.all([
    listShares(),
    listPreviews(),
    headers(),
  ]);

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : "";

  return (
    <>
      <PageHeader
        title="Delte lenker"
        subtitle={`${shares.length} aktive`}
        actions={
          <Link href="/visningsrom" className={btnGhost}>
            Tilbake
          </Link>
        }
      />
      <main className="mx-auto max-w-[1100px] px-5 py-6">
        {shares.length === 0 ? (
          <EmptyState
            title="Ingen delte lenker"
            body="Velg én eller flere previews i galleriet og trykk «Del med kunde» for å lage en lenke."
          />
        ) : (
          <ShareList shares={shares} previews={previews} origin={origin} />
        )}
      </main>
    </>
  );
}
