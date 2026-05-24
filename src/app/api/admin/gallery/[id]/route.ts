import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  GALLERY_MAX_BYTES,
  mediaTypeFromFilename,
  mediaTypeFromMime,
} from "@/lib/gallery";
import { prisma } from "@/lib/prisma";
import { unlink, mkdir, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

async function deleteMediaFile(mediaUrl: string) {
  if (!mediaUrl.startsWith("/uploads/gallery/")) return;
  const filePath = path.join(process.cwd(), "public", mediaUrl);
  await unlink(filePath).catch(() => {});
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.galleryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file || file.size === 0) {
        return NextResponse.json({ error: "Dosya seçin." }, { status: 400 });
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
        return NextResponse.json({ error: "Geçersiz dosya formatı." }, {
          status: 400,
        });
      }

      await deleteMediaFile(existing.mediaUrl);
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const filename = `${id}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "gallery");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(
        path.join(uploadDir, filename),
        Buffer.from(await file.arrayBuffer())
      );

      const title = formData.get("title");
      const description = formData.get("description");

      const updated = await prisma.galleryItem.update({
        where: { id },
        data: {
          mediaUrl: `/uploads/gallery/${filename}`,
          mediaType,
          ...(typeof title === "string" && title.trim().length >= 2
            ? { title: title.trim() }
            : {}),
          ...(typeof description === "string"
            ? { description: description.trim() }
            : {}),
        },
      });
      return NextResponse.json(updated);
    }

    const data = patchSchema.parse(await req.json());
    const updated = await prisma.galleryItem.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && {
          description: data.description.trim(),
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
    }
    return NextResponse.json({ error: "Güncellenemedi." }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.galleryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }
    await deleteMediaFile(existing.mediaUrl);
    await prisma.galleryItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Silinemedi" }, { status: 400 });
  }
}
