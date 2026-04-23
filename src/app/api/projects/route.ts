import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  nameRu: z.string().max(200).optional().nullable(),
  nameSk: z.string().max(200).optional().nullable(),
  desc: z.string().max(2000).optional().nullable(),
  descRu: z.string().max(2000).optional().nullable(),
  descSk: z.string().max(2000).optional().nullable(),
  stack: z.array(z.string().max(50)).max(30),
  github: z.string().url().optional().nullable().or(z.literal("")),
  url: z.string().url().optional().nullable().or(z.literal("")),
  order: z.number().int().optional(),
});

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { id, ...data } = parsed.data;
  const project = await prisma.project.create({ data: { id: id || undefined, ...data } });
  revalidatePath("/");
  return NextResponse.json(project, { status: 201 });
}
