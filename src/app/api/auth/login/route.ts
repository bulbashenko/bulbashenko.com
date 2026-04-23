import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionToken, createPendingSession, COOKIE_NAME, PENDING_COOKIE_NAME } from "@/lib/auth";

const schema = z.object({ password: z.string().min(1).max(128) });

const attempts = new Map<string, { count: number; resetAt: number }>();

function rateCheck(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function getClientInfo(req: NextRequest) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "unknown",
  };
}

export async function POST(req: NextRequest) {
  const { ip, userAgent } = getClientInfo(req);

  if (!rateCheck(ip)) {
    return NextResponse.json({ error: "Too many attempts. Wait 1 minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let settings = await prisma.settings.findFirst();
  if (!settings) {
    const defaultHash = await bcrypt.hash("admin123", 12);
    settings = await prisma.settings.create({ data: { id: 1, passwordHash: defaultHash } });
  }

  const match = await bcrypt.compare(parsed.data.password, settings.passwordHash);
  if (!match) {
    return NextResponse.json({ error: "INCORRECT PASSWORD" }, { status: 401 });
  }

  if (settings.totpEnabled && settings.totpSecret) {
    const pendingToken = await createPendingSession();
    const res = NextResponse.json({ requiresTotp: true });
    res.cookies.set(PENDING_COOKIE_NAME, pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 5 * 60,
    });
    return res;
  }

  const session = await prisma.session.create({ data: { ip, userAgent } });
  const token = await createSessionToken(session.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });
  return res;
}
