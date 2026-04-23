import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionId, COOKIE_NAME } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentSid = await getSessionId(req.cookies.get(COOKIE_NAME)?.value ?? "");

  await prisma.session.delete({ where: { id } }).catch(() => null);

  const res = NextResponse.json({ ok: true });

  // If the user revoked their own current session, clear the cookie too
  if (id === currentSid) {
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  }

  return res;
}
