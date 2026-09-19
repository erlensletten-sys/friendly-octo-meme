#!/usr/bin/env node
/**
 * Legger en mappe med en ferdig nettside inn i Visningsrom og lager en
 * offentlig deling med valgt slug - «utstillingen» arbeid-seksjonen på
 * hjemmesiden peker på. Kjøres på serveren der både appen og nettsidefilene
 * ligger:
 *
 *   node scripts/utstilling.mjs --find stenumgaard --title "Stenumgaard Design" --slug utstilling
 *   node scripts/utstilling.mjs --dir /var/www/stenumgaard/dist --title "…" --slug utstilling \
 *     [--dir demo/forslag-b --title "Forslag B"] [--app http://localhost:3000]
 *
 * --find leter i mappa ved siden av prosjektet (../) etter et navn og bruker
 * byggemappa der. --dir peker rett på en mappe.
 *
 * Passordet leses fra ADMIN_PASSWORD i miljøet eller .env.local. Går alt
 * gjennom det vanlige API-et, så det virker likt med fs- og blob-lagring.
 * Finnes sluggen fra før, slettes den gamle delingen først - da byttes
 * innholdet på hjemmesiden uten kodeendring.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { zipSync } from "fflate";

/**
 * --find <navn>: leter etter en mappe ved siden av prosjektmappa (../) som
 * inneholder navnet, og bruker byggemappa i den (dist/, out/, build/ eller
 * rota hvis index.html ligger der). Sier fra hvis sida bruker absolutte
 * stier - da vises den ikke riktig fra /serve/ uten en ny build.
 */
async function findSite(name) {
  const parent = resolve("..");
  const want = name.toLowerCase();
  const candidates = [];
  for (const entry of await readdir(parent, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.toLowerCase().includes(want)) candidates.push(join(parent, entry.name));
  }
  if (candidates.length === 0) throw new Error(`Fant ingen mappe med «${name}» i navnet under ${parent}`);
  if (candidates.length > 1) console.log(`· flere treff, bruker den første: ${candidates.map((c) => basename(c)).join(", ")}`);
  const root = candidates[0];
  for (const sub of ["dist", "out", "build", "public", "."]) {
    const dir = resolve(root, sub);
    try {
      await stat(join(dir, "index.html"));
      return dir;
    } catch {
      /* neste */
    }
  }
  throw new Error(`${root} har ingen index.html i dist/, out/, build/, public/ eller rota. Er sida bygget?`);
}

/** Absolutte stier (/assets/…) peker feil når kopien serveres fra /serve/<id>/. */
async function checkRelativePaths(dir) {
  const html = await readFile(join(dir, "index.html"), "utf8");
  const abs = [...html.matchAll(/(?:src|href)=["'](\/[^/"'][^"']*)["']/g)].map((m) => m[1]).filter((u) => !u.startsWith("//"));
  if (abs.length) {
    console.log(`! ${basename(dir)}/index.html bruker absolutte stier (${abs.slice(0, 3).join(", ")}${abs.length > 3 ? ", …" : ""}).`);
    console.log("  De peker feil fra /serve/. Bygg sida med relativ base (Vite: base './', Next: assetPrefix './') og kjør igjen.");
  }
}

const args = process.argv.slice(2);
const dirs = [];
const titles = [];
let slug = "";
let app = "http://localhost:3000";
let group = "Utstilling";
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--dir") dirs.push(resolve(args[++i]));
  else if (a === "--find") dirs.push(await findSite(args[++i]));
  else if (a === "--title") titles.push(args[++i]);
  else if (a === "--slug") slug = args[++i];
  else if (a === "--app") app = args[++i].replace(/\/$/, "");
  else if (a === "--group") group = args[++i];
  else {
    console.error(`Ukjent argument: ${a}`);
    process.exit(2);
  }
}
if (dirs.length === 0 || !slug) {
  console.error("Bruk: node scripts/utstilling.mjs (--dir <mappe> | --find <navn>) --title <navn> --slug <slug> [flere --dir/--find …]");
  process.exit(2);
}

const password = process.env.ADMIN_PASSWORD ?? (await readEnvLocal("ADMIN_PASSWORD"));

async function readEnvLocal(key) {
  try {
    const text = await readFile(resolve(".env.local"), "utf8");
    const line = text.split("\n").find((l) => l.trim().startsWith(key + "="));
    return line ? line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") : "";
  } catch {
    return "";
  }
}

/** Zipper mappa i minnet. Kjørbare filer avvises uansett av appen. */
async function zipDir(dir) {
  const files = {};
  let count = 0;
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) {
        files[relative(dir, full).split("\\").join("/")] = new Uint8Array(await readFile(full));
        count++;
      }
    }
  }
  await walk(dir);
  if (!count) throw new Error(`Ingen filer i ${dir}`);
  return { zip: zipSync(files, { level: 6 }), count };
}

let cookie = "";
async function login() {
  if (!password) {
    console.log("· ingen ADMIN_PASSWORD - antar at admin-delen er åpen");
    return;
  }
  const res = await fetch(`${app}/api/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(`Innlogging feilet: ${res.status} ${await res.text()}`);
  cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
}

async function api(path, init = {}) {
  const res = await fetch(`${app}${path}`, { ...init, headers: { ...(init.headers ?? {}), cookie } });
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* ikke json */ }
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${json.error ?? text.slice(0, 200)}`);
  return json;
}

await login();

const previewIds = [];
for (let i = 0; i < dirs.length; i++) {
  const dir = dirs[i];
  const title = titles[i] ?? dir.split("/").pop();
  const info = await stat(dir);
  if (!info.isDirectory()) throw new Error(`${dir} er ikke en mappe`);
  await checkRelativePaths(dir);
  const { zip, count } = await zipDir(dir);
  const form = new FormData();
  form.set("title", title);
  form.set("group", group);
  form.set("note", `Lagt inn av scripts/utstilling.mjs fra ${dir}`);
  form.set("file", new Blob([zip], { type: "application/zip" }), `${slug}-${i + 1}.zip`);
  const out = await api("/api/previews", { method: "POST", body: form });
  const created = out.created?.[0] ?? out.previews?.[0];
  if (!created?.id) throw new Error(`Opplasting av ${dir} ga ingen preview: ${JSON.stringify(out).slice(0, 200)}`);
  previewIds.push(created.id);
  console.log(`· ${title}: ${count} filer → /serve/${created.id}/`);
}

// Gammel deling under samme slug ryker, så innholdet byttes.
const existing = (await api("/api/shares")).shares?.find((s) => s.token === slug);
if (existing) {
  await api(`/api/shares/${encodeURIComponent(slug)}`, { method: "DELETE" });
  console.log(`· fjernet gammel deling «${slug}»`);
}

const { share } = await api("/api/shares", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ slug, previewIds, title: titles[0] ?? slug, intro: "", layout: "gallery", allowComments: false }),
});

console.log(`
Utstillingen er klar:
  kundelenke   ${app}/s/${share.token}
  sida selv    ${app}/vis/${share.token}${previewIds.length > 1 ? "  (?n=1 for neste)" : ""}
`);
