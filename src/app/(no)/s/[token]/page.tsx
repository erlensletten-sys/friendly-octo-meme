import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientView from "@/components/ClientView";
import { getPreviews, getShare, listCommentsFor } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const share = await getShare(token);
  if (!share) notFound();

  const previews = await getPreviews(share.previewIds);
  if (previews.length === 0) notFound();

  const comments = await listCommentsFor(previews.map((preview) => preview.id));
  return <ClientView share={share} previews={previews} comments={comments} />;
}
