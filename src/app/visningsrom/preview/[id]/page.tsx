import { notFound } from "next/navigation";
import SinglePreview from "@/components/SinglePreview";
import { getPreview, listComments } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const preview = await getPreview(id);
  if (!preview) notFound();

  const comments = await listComments(id);
  return <SinglePreview preview={preview} comments={comments} />;
}
