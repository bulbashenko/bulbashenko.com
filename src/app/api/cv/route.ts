import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  id: z.string().optional(),
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

export async function GET() {
  const entries = await prisma.cVEntry.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { id, ...data } = parsed.data;
  const entry = await prisma.cVEntry.create({ data: { id: id || undefined, ...data } });
  return NextResponse.json(entry, { status: 201 });
}
