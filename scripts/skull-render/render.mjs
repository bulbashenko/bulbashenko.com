// Renders one seamless loop of skull.html frame by frame and encodes MP4 (H.264), WebM (VP9) and a WebP poster.
//   node render.mjs [--seed N] [--dur SECONDS] [--out DIR] [--budget MB]
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { serve } from "./serve.mjs";

const { values: args } = parseArgs({
  options: {
    seed: { type: "string" },
    dur: { type: "string" },
    out: { type: "string", default: "out" },
    budget: { type: "string", default: "6" },
    width: { type: "string", default: "1920" },
    height: { type: "string", default: "1080" },
  },
});

const seed = Number(args.seed) >>> 0 || Math.floor(Math.random() * 2 ** 32) >>> 0;
const out = resolve(args.out);
const framesDir = join(out, "frames");
const budget = Number(args.budget) * 1024 * 1024;

function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const week = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-w${String(week).padStart(2, "0")}`;
}

function ffmpeg(...a) {
  const r = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...a], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${a.join(" ")}`);
}

// Two-pass encode at the bitrate that fills the size budget; ASCII detail barely compresses, so CRF overshoots.
function encode(file, seconds, codecArgs) {
  const kbps = Math.floor((budget * 8 * 0.95) / seconds / 1000);
  const input = ["-framerate", "30", "-i", join(framesDir, "%05d.png")];
  const common = [...codecArgs, "-b:v", `${kbps}k`, "-passlogfile", join(out, "pass")];
  ffmpeg(...input, ...common, "-pass", "1", "-an", "-f", "null", "/dev/null");
  ffmpeg(...input, ...common, "-pass", "2", "-an", file);
  console.log(`${file}: ${kbps} kbps`);
}

await rm(out, { recursive: true, force: true });
await mkdir(framesDir, { recursive: true });

const server = await serve();
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let info, frames;
try {
  const page = await browser.newPage({ viewport: { width: Number(args.width), height: Number(args.height) }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => { throw e; });
  await page.goto(`http://127.0.0.1:${server.address().port}/skull.html?render=1&seed=${seed}`);
  info = await page.evaluate(() => window.ready);
  frames = args.dur ? Math.min(info.frames, Math.round(Number(args.dur) * info.fps)) : info.frames;
  const started = Date.now();
  for (let i = 0; i < frames; i++) {
    await page.evaluate((i) => window.renderFrame(i), i);
    await page.screenshot({ path: join(framesDir, `${String(i).padStart(5, "0")}.png`) });
    if (i % 60 === 0) console.log(`frame ${i}/${frames} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
} finally {
  await browser.close();
  server.close();
}

const week = isoWeek();
const base = `skull-${week}-${seed}`;
const seconds = frames / info.fps;
encode(join(out, `${base}.mp4`), seconds,
  ["-c:v", "libx264", "-preset", "slow", "-pix_fmt", "yuv420p", "-g", "60", "-movflags", "+faststart"]);
encode(join(out, `${base}.webm`), seconds,
  ["-c:v", "libvpx-vp9", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", "-g", "60"]);
ffmpeg("-i", join(framesDir, "00000.png"), "-c:v", "libwebp", "-quality", "80", join(out, `${base}.webp`));

await writeFile(join(out, "meta.json"), JSON.stringify({ week, seed, base }, null, 2));
console.log(`done: ${base} (seed ${seed})`);
