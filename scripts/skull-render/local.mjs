// Copies the render from render.mjs into public/skull-local/ for testing the site without the media bucket.
//   node local.mjs [--out DIR]   then run the site with SKULL_MANIFEST_URL=/skull-local/current.json
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const { values: args } = parseArgs({ options: { out: { type: "string", default: "out" } } });
const out = resolve(args.out);
const target = fileURLToPath(new URL("../../public/skull-local/", import.meta.url));
const { week, seed, base } = JSON.parse(await readFile(join(out, "meta.json"), "utf8"));

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const ext of ["mp4", "webm", "webp"]) await copyFile(join(out, `${base}.${ext}`), join(target, `${base}.${ext}`));

const url = (ext) => `/skull-local/${base}.${ext}`;
await writeFile(join(target, "current.json"),
  JSON.stringify({ week, seed, mp4: url("mp4"), webm: url("webm"), poster: url("webp"), createdAt: new Date().toISOString() }, null, 2));
console.log(`public/skull-local/ ← ${base}\nnow run the site with SKULL_MANIFEST_URL=/skull-local/current.json`);
