import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(500),
  titleRu: z.string().max(500).optional().nullable(),
  titleSk: z.string().max(500).optional().nullable(),
  content: z.string().max(100_000),
  contentRu: z.string().max(100_000).optional().nullable(),
  contentSk: z.string().max(100_000).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string().max(50)).max(20),
  published: z.boolean(),
});

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  const posts = await prisma.post.findMany({
    where: all ? undefined : { published: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(
    posts.map((p: { createdAt: Date; updatedAt: Date; [key: string]: unknown }) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { id, ...data } = parsed.data;
  const post = await prisma.post.create({ data: { id: id || undefined, ...data } });
  return NextResponse.json(post, { status: 201 });
}
