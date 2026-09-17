import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { ALLOWED_CONTENT_TYPES, isValidUploadPathname, maxUploadBytes } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Utsteder et kortlivet token som lar nettleseren laste opp rett til
 * blob-lageret. Da går ikke fila gjennom serverless-funksjonen, og grensen på
 * ca. 4,5 MB per request gjelder ikke.
 *
 * Ruta ligger bak passordet i proxy.ts. Vi setter bevisst ingen
 * `onUploadCompleted`, slik at Vercel aldri kaller ruta utenfra – det eneste
 * kallet er nettleserens eget, med innlogget økt.
 */
export async function POST(request: Request) {
  if (storage().name !== "blob") {
    return NextResponse.json(
      { error: "Direkte opplasting krever at Vercel Blob er koblet til." },
      { status: 409 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Stien lages av klienten, så den må valideres før vi signerer noe.
        if (!isValidUploadPathname(pathname)) {
          throw new Error("Ugyldig filsti.");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: maxUploadBytes(),
          addRandomSuffix: false,
          allowOverwrite: false,
          validUntil: Date.now() + 60 * 60 * 1000,
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
