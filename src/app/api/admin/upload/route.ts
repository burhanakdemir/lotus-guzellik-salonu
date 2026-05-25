import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import {
  getUploadSubdir,
  uploadPublicUrl,
  type UploadSubdir,
} from "@/lib/uploads";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

function safeExt(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "jpg";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return "jpg";
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const slug = (formData.get("slug") as string | null)?.trim();
    const type = (formData.get("type") as string | null) || "service";

    if (!file || !slug) {
      return NextResponse.json({ error: "Dosya ve slug gerekli" }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: "Geçersiz slug" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Dosya en fazla 8 MB olabilir" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(bytes);
    const ext = safeExt(file.name);
    const filename = `${slug}.${ext}`;

    const subdir: UploadSubdir =
      type === "promotion" ? "promotions" : "services";

    const uploadDir = getUploadSubdir(subdir);
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    await access(filePath);

    const imageUrl = uploadPublicUrl(subdir, filename);
    return NextResponse.json({ imageUrl, filename });
  } catch (e) {
    console.error("[upload]", e);
    const msg =
      e instanceof Error && e.message.includes("EACCES")
        ? "Yükleme klasörüne yazılamıyor (disk mount kontrol edin)"
        : "Yükleme başarısız";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
