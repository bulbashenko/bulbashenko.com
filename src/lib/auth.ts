import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const COOKIE_NAME = "bul_session";
export const PENDING_COOKIE_NAME = "bul_totp_pending";
const JWT_ALG = "HS256";

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

export async function createPendingSession(): Promise<string> {
  return new SignJWT({ pending: true })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("5m")
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

export async function verifyPendingSession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.pending === true;
  } catch {
    return false;
  }
}

export async function getSessionFromRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySession(token);
}
