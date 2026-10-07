// Uploads the render from render.mjs to the S3 media bucket (Garage), points skull/current.json at it and prunes old weeks.
//   S3_ENDPOINT=... S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... S3_BUCKET=... MEDIA_PUBLIC_URL=... \
//   node publish.mjs [--out DIR] [--keep 4]
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    out: { type: "string", default: "out" },
    keep: { type: "string", default: "4" },
  },
});

for (const name of ["S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET", "MEDIA_PUBLIC_URL"]) {
  if (!process.env[name]) throw new Error(`${name} is not set`);
}

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "garage",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});
const Bucket = process.env.S3_BUCKET;

const PUBLIC_URL = process.env.MEDIA_PUBLIC_URL.replace(/\/$/, "");

const PREFIX = "skull/";
const YEAR = 60 * 60 * 24 * 365;
const out = resolve(args.out);
const { week, seed, base } = JSON.parse(await readFile(join(out, "meta.json"), "utf8"));

async function put(Key, Body, ContentType, maxAge) {
  await s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType, CacheControl: `public, max-age=${maxAge}` }));
  return `${PUBLIC_URL}/${Key}`;
}

async function upload(ext, contentType) {
  const url = await put(`${PREFIX}${base}.${ext}`, await readFile(join(out, `${base}.${ext}`)), contentType, YEAR);
  console.log(`uploaded ${url}`);
  return url;
}

// Videos first, manifest second: visitors never see a manifest pointing at missing files.
const [mp4, webm, poster] = await Promise.all([
  upload("mp4", "video/mp4"),
  upload("webm", "video/webm"),
  upload("webp", "image/webp"),
]);

const manifest = { week, seed, mp4, webm, poster, createdAt: new Date().toISOString() };
const current = await put(`${PREFIX}current.json`, JSON.stringify(manifest, null, 2), "application/json", 3600);
console.log(`manifest ${current}`);

// Keep the newest N renders (a render = week + seed); never delete the one just published.
const objects = [];
let ContinuationToken;
do {
  const page = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: PREFIX, ContinuationToken }));
  objects.push(...(page.Contents ?? []));
  ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
} while (ContinuationToken);

const renders = new Map();
for (const o of objects) {
  const m = o.Key.match(/^skull\/(skull-\d{4}-w\d{2}-\d+)\.\w+$/);
  if (!m) continue;
  const r = renders.get(m[1]) ?? { keys: [], uploadedAt: 0 };
  r.keys.push(o.Key);
  r.uploadedAt = Math.max(r.uploadedAt, new Date(o.LastModified).getTime());
  renders.set(m[1], r);
}
const stale = [...renders.entries()]
  .filter(([name]) => name !== base)
  .sort((a, b) => b[1].uploadedAt - a[1].uploadedAt)
  .slice(Math.max(0, Number(args.keep) - 1));
for (const [name, r] of stale) {
  await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: r.keys.map((Key) => ({ Key })) } }));
  console.log(`pruned ${name}`);
}
