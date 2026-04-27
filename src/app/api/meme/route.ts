import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

const SUBREDDITS: Record<string, string[]> = {
  dev:    ["ProgrammerHumor", "linuxmemes", "sysadminhumor", "devops"],
  random: ["memes", "dankmemes", "me_irl"],
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("cat") ?? "dev";
  const pool = SUBREDDITS[category] ?? SUBREDDITS.dev;
  const sub = pool[Math.floor(Math.random() * pool.length)];

  try {
    const res = await fetch(`https://meme-api.com/gimme/${sub}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
