import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  password: z.string().min(8).max(128),
});

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const hash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, passwordHash: hash },
    update: { passwordHash: hash },
  });

  return NextResponse.json({ ok: true });
}
