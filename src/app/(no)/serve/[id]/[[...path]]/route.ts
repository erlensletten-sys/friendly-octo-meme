import { NextResponse } from "next/server";
import { getPreview, readPreviewFile } from "@/lib/store";
import { contentTypeFor, isHtml } from "@/lib/mime";
import { injectBridge } from "@/lib/inject";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; path?: string[] }> };

/**
 * Serverer filene i en opplastet preview. Dette er den eneste ruta som
 * leverer innhold vi ikke har skrevet selv, så den er sandboxet:
 *
 *  - CSP `sandbox` uten `allow-same-origin` gir dokumentet en ugjennomsiktig
 *    origin. Malen kan dermed ikke lese cookies, localStorage eller kalle
 *    API-ene våre med innlogget økt.
 *  - `nosniff` hindrer at nettleseren gjetter en annen filtype enn vi oppgir.
 *  - Ingen kjørbare filtyper pakkes ut fra ZIP (se lib/mime.ts).
 */
export async function GET(request: Request, context: Context) {
  const { id, path } = await context.params;

  const preview = await getPreview(id);
  if (!preview || preview.kind !== "bundle" || !preview.entry) {
    return new NextResponse("Fant ikke previewen.", { status: 404 });
  }

  const relative = (path ?? []).map(decodeURIComponent).join("/");

  // /serve/<id> peker videre til rot-dokumentet, slik at relative stier i
  // malen ("./css/style.css") løses riktig også når entry ligger i en undermappe.
  if (!relative) {
    return NextResponse.redirect(new URL(`/serve/${id}/${preview.entry}`, request.url), 307);
  }

  let key = relative;
  let data = await readPreviewFile(id, key);

  // Mappe-URL uten filnavn: prøv index.html i mappa.
  if (!data && !relative.includes(".")) {
    key = `${relative.replace(/\/$/, "")}/index.html`;
    data = await readPreviewFile(id, key);
  }

  if (!data) {
    return new NextResponse("Fant ikke fila i pakken.", { status: 404 });
  }

  const strict = (process.env.PREVIEW_STRICT_SANDBOX ?? "true").toLowerCase() !== "false";
  const headers = new Headers({
    "Content-Type": contentTypeFor(key),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (strict) {
    headers.set(
      "Content-Security-Policy",
      "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads",
    );
  }

  if (isHtml(key)) {
    const html = injectBridge(new TextDecoder().decode(data));
    return new NextResponse(html, { headers });
  }

  return new NextResponse(new Uint8Array(data) as unknown as BodyInit, { headers });
}
