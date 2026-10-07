import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const COOKIE_NAME = "bul_session";
const JWT_ALG = "HS256";
const SESSION_MAX_AGE = 60 * 60; // seconds; proxy.ts renews the cookie on activity

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

// sid ties the JWT to a specific Session row — allows immediate revocation
export async function createSessionToken(sid: string): Promise<string> {
  return new SignJWT({ admin: true, sid })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function getSessionId(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.sid === "string" ? payload.sid : null;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySession(token);
}

function getClientInfo(req: NextRequest) {
  return {
    ip: req.headers.get("cf-connecting-ip")
      ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "unknown",
  };
}

// Records a new admin session for this device and sets its cookie on the response.
export async function startSession(req: NextRequest, res: NextResponse): Promise<void> {
  const session = await prisma.session.create({ data: getClientInfo(req) });
  res.cookies.set(COOKIE_NAME, await createSessionToken(session.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}
