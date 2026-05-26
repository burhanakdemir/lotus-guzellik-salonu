import { NextResponse } from "next/server";
import {
  AdminForbiddenError,
  AdminUnauthorizedError,
} from "@/lib/admin-permissions";
import {
  actorFromSession,
  assertCanManageStaffContent,
  resolveStaffContentScope,
} from "@/lib/staff-content-scope";
import { requireStaffContentAccess } from "@/lib/auth";
import {
  GALLERY_MAX_BYTES,
  mediaTypeFromFilename,
  mediaTypeFromMime,
} from "@/lib/gallery";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/staff-admin";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  try {
    const session = await requireStaffContentAccess();
    const personel = new URL(req.url).searchParams.get("personel");
    const scope = await resolveStaffContentScope(session, personel);

    const items = await prisma.galleryItem.findMany({
      where: scope.staffFilter,
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

async function resolveUploadStaffProfileId(
  session: Awaited<ReturnType<typeof requireStaffContentAccess>>,
  personelSlug: string | null
): Promise<string | null> {
  if (!isSuperAdmin(session.role)) {
    return session.staffProfileId ?? null;
  }
  if (!personelSlug?.trim()) return null;
  const scope = await resolveStaffContentScope(session, personelSlug);
  return scope.staffProfileId;
}

export async function POST(req: Request) {
  try {
    const session = await requireStaffContentAccess();
    const formData = await req.formData();
    const personel = String(formData.get("personel") ?? "").trim() || null;
    const staffProfileId = await resolveUploadStaffProfileId(session, personel);

    if (isSuperAdmin(session.role) && !staffProfileId) {
      return NextResponse.json(
        { error: "Yükleme için bir usta seçin." },
        { status: 400 }
      );
    }

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
      where: staffProfileId ? { staffProfileId } : {},
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
        staffProfileId,
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
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (e instanceof AdminForbiddenError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
    return NextResponse.json({ error: "Yüklenemedi." }, { status: 500 });
  }
}
