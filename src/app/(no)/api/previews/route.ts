import { NextResponse } from "next/server";
import { cleanText } from "@/lib/id";
import { listPreviews } from "@/lib/store";
import {
  createBundlePreview,
  createUrlPreview,
  maxUploadBytes,
  maxUploadLabel,
  titleFromName,
} from "@/lib/uploads";
import type { Preview } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ previews: await listPreviews() });
}

/**
 * Opplasting gjennom vår egen server (multipart). Brukes lokalt og på egen
 * server. På Vercel går filer i stedet rett til blob-lageret fra nettleseren –
 * se /api/previews/client-token og /api/previews/finalize.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Kunne ikke lese opplastingen." }, { status: 400 });
  }

  const group = cleanText(form.get("group"), 80);
  const note = cleanText(form.get("note"), 500);
  const explicitTitle = cleanText(form.get("title"), 120);
  const url = cleanText(form.get("url"), 500);
  const files = form.getAll("file").filter((value): value is File => value instanceof File);

  const created: Preview[] = [];
  const failed: { name: string; reason: string }[] = [];

  if (url) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Ugyldig adresse." }, { status: 400 });
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json(
        { error: "Adressen må starte med http:// eller https://" },
        { status: 400 },
      );
    }
    created.push(
      await createUrlPreview({
        url: parsed.toString(),
        title: explicitTitle || parsed.hostname.replace(/^www\./, ""),
        group,
        note,
      }),
    );
  }

  for (const file of files) {
    if (file.size === 0) {
      failed.push({ name: file.name, reason: "Tom fil." });
      continue;
    }
    if (file.size > maxUploadBytes()) {
      failed.push({ name: file.name, reason: `Større enn grensen på ${maxUploadLabel()}.` });
      continue;
    }
    try {
      created.push(
        await createBundlePreview(file.name, new Uint8Array(await file.arrayBuffer()), {
          // Flere filer i samme slipp deler gruppe og notat, men beholder eget navn.
          title: files.length === 1 && explicitTitle ? explicitTitle : titleFromName(file.name),
          group,
          note,
        }),
      );
    } catch (error) {
      failed.push({ name: file.name, reason: (error as Error).message });
    }
  }

  if (created.length === 0) {
    return NextResponse.json(
      { error: failed[0]?.reason ?? "Ingenting å laste opp.", failed },
      { status: 400 },
    );
  }

  return NextResponse.json({ previews: created, failed }, { status: 201 });
}
