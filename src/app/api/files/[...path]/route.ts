import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getUploadRoot } from "@/lib/uploads";

const ALLOWED = new Set(["services", "gallery", "reviews", "promotions"]);

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
};

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path;
  if (!segments?.length || segments.length < 2) {
    return NextResponse.json({ error: "Geçersiz yol" }, { status: 400 });
  }

  const [subdir, ...rest] = segments;
  if (!ALLOWED.has(subdir) || rest.some((s) => s.includes(".."))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const filename = rest.join("/");
  const root = path.resolve(getUploadRoot());
  const filePath = path.resolve(root, subdir, filename);

  if (!filePath.startsWith(path.join(root, subdir))) {
    return NextResponse.json({ error: "Geçersiz dosya" }, { status: 403 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }
    const buf = await readFile(filePath);
    const ext = path.extname(filename).slice(1).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
