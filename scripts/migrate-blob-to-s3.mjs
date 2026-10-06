// One-off: copies every Vercel Blob file referenced in the database to the S3 media bucket and rewrites the URLs.
// Scans all text/varchar/jsonb columns, so markdown bodies and JSON fields are covered too.
//   DATABASE_URL=... S3_ENDPOINT=... S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... S3_BUCKET=... \
//   MEDIA_PUBLIC_URL=https://media.bulbashenko.com node scripts/migrate-blob-to-s3.mjs [--dry-run]
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import pg from "pg";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({ options: { "dry-run": { type: "boolean", default: false } } });
const dryRun = args["dry-run"];

for (const name of ["DATABASE_URL", "S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET", "MEDIA_PUBLIC_URL"]) {
  if (!process.env[name]) throw new Error(`${name} is not set`);
}
const MEDIA = process.env.MEDIA_PUBLIC_URL.replace(/\/$/, "");
const BLOB_URL = /https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s"'()<>\]\\]+/gi;

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "garage",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
});
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { rows: columns } = await db.query(`
  SELECT table_name, column_name, data_type FROM information_schema.columns
  WHERE table_schema = 'public' AND data_type IN ('text', 'character varying', 'jsonb')`);

// 1. Find every referenced Blob URL and the columns that hold them.
const urls = new Set();
const origins = new Set();
const dirty = [];
for (const { table_name: t, column_name: c, data_type: type } of columns) {
  const { rows } = await db.query(
    `SELECT "${c}"::text AS v FROM "${t}" WHERE "${c}"::text LIKE '%.public.blob.vercel-storage.com/%'`
  );
  if (!rows.length) continue;
  dirty.push({ t, c, type, count: rows.length });
  for (const { v } of rows) {
    for (const url of v.match(BLOB_URL) ?? []) {
      urls.add(url);
      origins.add(new URL(url).origin);
    }
  }
}
console.log(`${urls.size} files referenced in ${dirty.map((d) => `${d.t}.${d.c} (${d.count} rows)`).join(", ") || "nothing"}`);

// 2. Copy files: same pathname in the bucket.
for (const url of urls) {
  const key = decodeURIComponent(new URL(url).pathname.slice(1));
  if (dryRun) {
    console.log(`would copy ${url} -> ${MEDIA}/${key}`);
    continue;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: new Uint8Array(await res.arrayBuffer()),
      ContentType: res.headers.get("content-type") ?? undefined,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  console.log(`copied ${key}`);
}

// 3. Rewrite URLs, in one transaction.
if (!dryRun) {
  await db.query("BEGIN");
  for (const { t, c, type } of dirty) {
    for (const origin of origins) {
      const expr = `replace("${c}"::text, $1, $2)`;
      const { rowCount } = await db.query(
        `UPDATE "${t}" SET "${c}" = ${type === "jsonb" ? `${expr}::jsonb` : expr} WHERE "${c}"::text LIKE $3`,
        [origin, MEDIA, `%${origin}%`]
      );
      console.log(`rewrote ${rowCount} rows in ${t}.${c}`);
    }
  }
  await db.query("COMMIT");
}
await db.end();
