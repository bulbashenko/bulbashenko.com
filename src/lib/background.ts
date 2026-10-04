import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { SkullBackgroundData } from "@/types";

// Written weekly by scripts/skull-render/publish.mjs (see .github/workflows/skull-background.yml).
const manifestSchema = z.object({
  week: z.string(),
  seed: z.number(),
  mp4: z.string(),
  webm: z.string(),
  poster: z.string(),
});

// SKULL_MANIFEST_URL is the R2 URL of skull/current.json (https://media.bulbashenko.com/skull/current.json), or a path under public/ for local testing
// (e.g. /skull-local/current.json, written by scripts/skull-render/local.mjs).
async function loadManifest(url: string): Promise<unknown> {
  if (url.startsWith("/")) return JSON.parse(await readFile(join(process.cwd(), "public", url), "utf8"));
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  return res.json();
}

export async function getSkullBackground(): Promise<SkullBackgroundData | null> {
  const url = process.env.SKULL_MANIFEST_URL;
  if (!url) return null;
  try {
    const { week, seed, mp4, webm, poster } = manifestSchema.parse(await loadManifest(url));
    return { week, seed, mp4, webm, poster };
  } catch {
    return null;
  }
}
