import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const slug = formData.get("slug") as string | null;
    const type = (formData.get("type") as string | null) || "service";

    if (!file || !slug) {
      return NextResponse.json({ error: "Dosya ve slug gerekli" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${slug}.${ext}`;

    const subdir = type === "promotion" ? "promotions" : "services";
    const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const imageUrl = `/uploads/${subdir}/${filename}`;
    return NextResponse.json({ imageUrl, filename });
  } catch {
    return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 });
  }
}
