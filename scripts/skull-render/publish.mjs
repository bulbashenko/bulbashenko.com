// Uploads the render from render.mjs to Vercel Blob, points skull/current.json at it and prunes old weeks.
//   BLOB_READ_WRITE_TOKEN=... node publish.mjs [--out DIR] [--keep 4]
import { put, list, del } from "@vercel/blob";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    out: { type: "string", default: "out" },
    keep: { type: "string", default: "4" },
  },
});

const PREFIX = "skull/";
const YEAR = 60 * 60 * 24 * 365;
const out = resolve(args.out);
const { week, seed, base } = JSON.parse(await readFile(join(out, "meta.json"), "utf8"));

async function upload(ext, contentType) {
  const blob = await put(`${PREFIX}${base}.${ext}`, await readFile(join(out, `${base}.${ext}`)), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: YEAR,
    contentType,
  });
  console.log(`uploaded ${blob.url}`);
  return blob.url;
}

// Videos first, manifest second: visitors never see a manifest pointing at missing files.
const [mp4, webm, poster] = await Promise.all([
  upload("mp4", "video/mp4"),
  upload("webm", "video/webm"),
  upload("webp", "image/webp"),
]);

const manifest = { week, seed, mp4, webm, poster, createdAt: new Date().toISOString() };
const current = await put(`${PREFIX}current.json`, JSON.stringify(manifest, null, 2), {
  access: "public",
  addRandomSuffix: false,
  allowOverwrite: true,
  cacheControlMaxAge: 3600,
  contentType: "application/json",
});
console.log(`manifest ${current.url}`);

// Keep the newest N renders (a render = week + seed); never delete the one just published.
const blobs = [];
let cursor;
do {
  const page = await list({ prefix: PREFIX, cursor });
  blobs.push(...page.blobs);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

const renders = new Map();
for (const b of blobs) {
  const m = b.pathname.match(/^skull\/(skull-\d{4}-w\d{2}-\d+)\.\w+$/);
  if (!m) continue;
  const r = renders.get(m[1]) ?? { urls: [], uploadedAt: 0 };
  r.urls.push(b.url);
  r.uploadedAt = Math.max(r.uploadedAt, new Date(b.uploadedAt).getTime());
  renders.set(m[1], r);
}
const stale = [...renders.entries()]
  .filter(([name]) => name !== base)
  .sort((a, b) => b[1].uploadedAt - a[1].uploadedAt)
  .slice(Math.max(0, Number(args.keep) - 1));
for (const [name, r] of stale) {
  await del(r.urls);
  console.log(`pruned ${name}`);
}
