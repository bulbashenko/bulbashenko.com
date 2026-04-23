import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(200),
  nameRu: z.string().max(200).optional().nullable(),
  nameSk: z.string().max(200).optional().nullable(),
  desc: z.string().max(2000).optional().nullable(),
  descRu: z.string().max(2000).optional().nullable(),
  descSk: z.string().max(2000).optional().nullable(),
  stack: z.array(z.string().max(50)).max(30),
  github: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  order: z.number().int().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  try {
    const project = await prisma.project.update({ where: { id }, data: parsed.data });
    revalidatePath("/");
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.project.delete({ where: { id } });
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
