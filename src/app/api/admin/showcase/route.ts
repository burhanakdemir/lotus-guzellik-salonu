import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { AdminUnauthorizedError } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import {
  showcaseFieldKey,
  type ShowcaseSlot,
} from "@/lib/showcase-images";
import { getUploadSubdir, uploadPublicUrl } from "@/lib/uploads";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

function parseSlot(value: string | null): ShowcaseSlot | null {
  const n = Number(value);
  if (n >= 1 && n <= 4 && Number.isInteger(n)) return n as ShowcaseSlot;
  return null;
}

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
    const slot = parseSlot(formData.get("slot") as string | null);

    if (!file || !slot) {
      return NextResponse.json(
        { error: "Dosya ve alan (1–4) gerekli" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Dosya en fazla 8 MB olabilir" },
        { status: 400 }
      );
    }

    const ext = safeExt(file.name);
    const filename = `slot-${slot}.${ext}`;
    const uploadDir = getUploadSubdir("salon");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, Buffer.from(bytes));

    const imageUrl = uploadPublicUrl("salon", filename);
    const field = showcaseFieldKey(slot);

    await prisma.salonSettings.update({
      where: { id: "default" },
      data: { [field]: imageUrl },
    });

    return NextResponse.json({ slot, imageUrl });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }
    console.error("[showcase POST]", e);
    const msg =
      e instanceof Error && e.message.includes("showcaseImage")
        ? "Veritabanı güncel değil — prisma generate ve db push çalıştırın"
        : "Yüklenemedi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const slot = parseSlot(new URL(req.url).searchParams.get("slot"));
    if (!slot) {
      return NextResponse.json({ error: "Alan 1–4 gerekli" }, { status: 400 });
    }

    const field = showcaseFieldKey(slot);
    const settings = await prisma.salonSettings.findUnique({
      where: { id: "default" },
      select: {
        showcaseImage1: true,
        showcaseImage2: true,
        showcaseImage3: true,
        showcaseImage4: true,
      },
    });
    const current = settings?.[field] ?? null;

    if (current) {
      const match = current.match(/\/api\/files\/salon\/(.+)$/);
      if (match?.[1]) {
        const filePath = path.join(getUploadSubdir("salon"), match[1]);
        await unlink(filePath).catch(() => {});
      }
    }

    await prisma.salonSettings.update({
      where: { id: "default" },
      data: { [field]: null },
    });

    return NextResponse.json({ slot, imageUrl: null });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }
    console.error("[showcase DELETE]", e);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
