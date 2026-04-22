import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  id: z.string().optional(),
  src: z.string().min(1).max(5000),
  caption: z.string().max(500).optional().nullable(),
  order: z.number().int().optional(),
});

export async function GET() {
  const images = await prisma.galleryImage.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(images);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { id, ...data } = parsed.data;
  const image = await prisma.galleryImage.create({ data: { id: id || undefined, ...data } });
  return NextResponse.json(image, { status: 201 });
}
