import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  GALLERY_MAX_BYTES,
  mediaTypeFromFilename,
  mediaTypeFromMime,
} from "@/lib/gallery";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    await requireAdmin();
    const items = await prisma.galleryItem.findMany({
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Dosya seçin." }, { status: 400 });
    }
    if (title.length < 2) {
      return NextResponse.json(
        { error: "Başlık en az 2 karakter olmalı." },
        { status: 400 }
      );
    }
    if (file.size > GALLERY_MAX_BYTES) {
      return NextResponse.json(
        { error: "Dosya çok büyük (en fazla 80 MB)." },
        { status: 400 }
      );
    }

    const mediaType =
      mediaTypeFromMime(file.type) ?? mediaTypeFromFilename(file.name);
    if (!mediaType) {
      return NextResponse.json(
        {
          error:
            "Desteklenen formatlar: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV.",
        },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.galleryItem.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;

    const item = await prisma.galleryItem.create({
      data: {
        title,
        description,
        mediaType,
        mediaUrl: "/uploads/gallery/pending",
        sortOrder,
        isActive: true,
      },
    });

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const filename = `${item.id}.${ext}`;
    const { getUploadSubdir, uploadPublicUrl } = await import("@/lib/uploads");
    const uploadDir = getUploadSubdir("gallery");
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const mediaUrl = uploadPublicUrl("gallery", filename);
    const updated = await prisma.galleryItem.update({
      where: { id: item.id },
      data: { mediaUrl },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    return NextResponse.json({ error: "Yüklenemedi." }, { status: 500 });
  }
}
