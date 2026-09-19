import Gallery from "@/components/Gallery";
import { listPreviews } from "@/lib/store";
import { storageName } from "@/lib/storage";
import { maxUploadBytes } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const previews = await listPreviews();

  return (
    <Gallery
      previews={previews}
      // Rett til blob-lageret når Vercel Blob er koblet til, ellers gjennom serveren.
      directUpload={storageName() === "blob"}
      maxUploadMb={Math.round(maxUploadBytes() / (1024 * 1024))}
    />
  );
}
