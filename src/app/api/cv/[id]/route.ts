import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  type: z.enum(["experience", "education", "certification"]),
  role: z.string().max(200).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  degree: z.string().max(200).optional().nullable(),
  institution: z.string().max(200).optional().nullable(),
  name: z.string().max(200).optional().nullable(),
  issuer: z.string().max(200).optional().nullable(),
  start: z.string().max(20).optional().nullable(),
  end: z.string().max(20).optional().nullable(),
  desc: z.string().max(2000).optional().nullable(),
  date: z.string().max(20).optional().nullable(),
  order: z.number().int().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  try {
    const entry = await prisma.cVEntry.update({ where: { id }, data: parsed.data });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.cVEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
