import { NextResponse } from "next/server";
import { cleanText } from "@/lib/id";
import { storage } from "@/lib/storage";
import {
  createBundlePreview,
  isValidUploadPathname,
  maxUploadBytes,
  maxUploadLabel,
  titleFromName,
} from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Andre halvdel av en direkte opplasting: fila ligger allerede i lageret under
 * uploads/. Her leses den, pakkes ut til en preview, og den midlertidige fila
 * ryddes bort. Selve request-body er noen hundre bytes, så størrelsesgrensen på
 * serverless-funksjoner er ikke i veien.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const pathname = typeof body.pathname === "string" ? body.pathname : "";
  const fileName = cleanText(body.fileName, 200) || pathname.split("/").pop() || "opplasting.zip";

  if (!isValidUploadPathname(pathname)) {
    return NextResponse.json({ error: "Ugyldig filsti." }, { status: 400 });
  }

  const driver = storage();
  // Hele mappa ryddes, ikke bare fila, så ingen tomme rester blir igjen.
  const uploadFolder = pathname.slice(0, pathname.lastIndexOf("/"));
  const data = await driver.get(pathname);
  if (!data) {
    return NextResponse.json({ error: "Fant ikke den opplastede fila." }, { status: 404 });
  }

  if (data.byteLength > maxUploadBytes()) {
    await driver.remove(uploadFolder);
    return NextResponse.json(
      { error: `Større enn grensen på ${maxUploadLabel()}.` },
      { status: 413 },
    );
  }

  try {
    const preview = await createBundlePreview(fileName, data, {
      title: cleanText(body.title, 120) || titleFromName(fileName),
      group: cleanText(body.group, 80),
      note: cleanText(body.note, 500),
    });
    return NextResponse.json({ previews: [preview], failed: [] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  } finally {
    // Råfila trengs ikke etter utpakking, uansett om den lyktes eller ikke.
    await driver.remove(uploadFolder).catch(() => undefined);
  }
}
