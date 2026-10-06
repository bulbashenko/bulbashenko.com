import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { isStorageConfigured, putPublic } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
// The extension comes from the validated MIME type, never from the client-supplied file name.
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = EXTENSIONS[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Invalid file type. Allowed: jpg, png, gif, webp, avif" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Max 5 MB." }, { status: 400 });
  }

  // Object storage (Garage) if it is configured
  if (isStorageConfigured()) {
    try {
      const url = await putPublic(`gallery/${randomUUID()}.${ext}`, new Uint8Array(await file.arrayBuffer()), file.type);
      return NextResponse.json({ url });
    } catch (err) {
      console.error("[upload] storage error:", err);
      return NextResponse.json(
        { error: "Upload failed", detail: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      );
    }
  }

  // Fallback: local filesystem storage (development)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
