import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionId, COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const currentSid = await getSessionId(req.cookies.get(COOKIE_NAME)?.value ?? "");

  const sessions = await prisma.session.findMany({
    orderBy: { lastSeen: "desc" },
  });

  return NextResponse.json(
    sessions.map((s) => ({ ...s, current: s.id === currentSid })),
  );
}

// DELETE all sessions except current (or all if ?all=1)
export async function DELETE(req: NextRequest) {
  const all = new URL(req.url).searchParams.get("all") === "1";
  const currentSid = await getSessionId(req.cookies.get(COOKIE_NAME)?.value ?? "");

  if (all) {
    await prisma.session.deleteMany();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return res;
  }

  if (currentSid) {
    await prisma.session.deleteMany({ where: { id: { not: currentSid } } });
  }

  return NextResponse.json({ ok: true });
}
