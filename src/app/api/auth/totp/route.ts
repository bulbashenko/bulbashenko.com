import { NextRequest, NextResponse } from "next/server";
import { verifySync } from "otplib";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionToken, verifyPendingSession, COOKIE_NAME, PENDING_COOKIE_NAME } from "@/lib/auth";
import { decryptTotpSecret, hashRecoveryCode } from "@/lib/totp-crypto";

const schema = z.object({ code: z.string().min(1).max(32) });

function getClientInfo(req: NextRequest) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "unknown",
  };
}

export async function POST(req: NextRequest) {
  const pendingToken = req.cookies.get(PENDING_COOKIE_NAME)?.value;
  if (!pendingToken || !(await verifyPendingSession(pendingToken))) {
    return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const settings = await prisma.settings.findFirst();
  if (!settings?.totpEnabled || !settings.totpSecret) {
    return NextResponse.json({ error: "2FA not configured" }, { status: 400 });
  }

  const input = parsed.data.code.trim();
  const isTotpCode = /^\d{6}$/.test(input);
  let authenticated = false;

  if (isTotpCode) {
    const secret = decryptTotpSecret(settings.totpSecret);
    authenticated = verifySync({ token: input, secret }).valid;
  } else {
    const inputHash = hashRecoveryCode(input);
    const matchIndex = settings.recoveryHashes.indexOf(inputHash);
    if (matchIndex !== -1) {
      authenticated = true;
      await prisma.settings.update({
        where: { id: 1 },
        data: { recoveryHashes: settings.recoveryHashes.filter((_, i) => i !== matchIndex) },
      });
    }
  }

  if (!authenticated) {
    return NextResponse.json(
      { error: isTotpCode ? "INVALID CODE" : "INVALID RECOVERY CODE" },
      { status: 401 },
    );
  }

  const { ip, userAgent } = getClientInfo(req);
  const session = await prisma.session.create({ data: { ip, userAgent } });
  const sessionToken = await createSessionToken(session.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });
  res.cookies.set(PENDING_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
