import { NextResponse } from "next/server";
import {
  AdminForbiddenError,
  AdminUnauthorizedError,
} from "@/lib/admin-permissions";
import {
  actorFromSession,
  assertCanManageStaffContent,
} from "@/lib/staff-content-scope";
import { requireStaffContentAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteReviewImages,
  MEMBER_MAX_REVIEW_IMAGES,
  parseKeepImageUrls,
  parseReviewImageFiles,
  saveReviewImages,
  validateReviewImageFiles,
} from "@/lib/reviews";
import { normalizePhone } from "@/lib/utils";
import { ReviewStatus } from "@prisma/client";
import { z } from "zod";

const patchSchema = z.object({
  content: z.string().min(10).max(2000).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  guestName: z.string().min(2).optional(),
  guestPhone: z
    .string()
    .transform((p) => normalizePhone(p))
    .refine((p) => p.length === 10)
    .optional(),
  guestEmail: z.string().email().optional(),
  removeImages: z.boolean().optional(),
  keepImageUrls: z.array(z.string()).optional(),
});

async function applyImageUpdate(
  reviewId: string,
  existingUrls: string[],
  keepUrls: string[],
  newFiles: File[]
): Promise<{ imageUrls: string[] } | { error: string }> {
  const finalCount = keepUrls.length + newFiles.length;
  if (finalCount > MEMBER_MAX_REVIEW_IMAGES) {
    return { error: `En fazla ${MEMBER_MAX_REVIEW_IMAGES} resim olabilir.` };
  }

  const maxNew = MEMBER_MAX_REVIEW_IMAGES - keepUrls.length;
  const imageError = validateReviewImageFiles(newFiles, maxNew);
  if (imageError) return { error: imageError };

  const removed = existingUrls.filter((url) => !keepUrls.includes(url));
  if (removed.length > 0) await deleteReviewImages(removed);

  const newUrls = newFiles.length > 0 ? await saveReviewImages(reviewId, newFiles) : [];
  return { imageUrls: [...keepUrls, ...newUrls] };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaffContentAccess();
    const { id } = await params;
    const existing = await prisma.customerReview.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }
    assertCanManageStaffContent(actorFromSession(session), existing);

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const content = String(formData.get("content") ?? "").trim();
      const newFiles = parseReviewImageFiles(formData);
      const keepUrls = parseKeepImageUrls(formData, existing.imageUrls);

      const imageResult = await applyImageUpdate(id, existing.imageUrls, keepUrls, newFiles);
      if ("error" in imageResult) {
        return NextResponse.json({ error: imageResult.error }, { status: 400 });
      }

      const updated = await prisma.customerReview.update({
        where: { id },
        data: {
          ...(content.length >= 10 && { content }),
          imageUrls: imageResult.imageUrls,
          ...(formData.get("guestName") && {
            guestName: String(formData.get("guestName")).trim(),
          }),
          ...(formData.get("guestPhone") && {
            guestPhone: normalizePhone(String(formData.get("guestPhone"))),
          }),
          ...(formData.get("guestEmail") && {
            guestEmail: String(formData.get("guestEmail")).trim().toLowerCase(),
          }),
        },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
        },
      });
      return NextResponse.json(updated);
    }

    const data = patchSchema.parse(await req.json());

    let imageUrls = existing.imageUrls;
    if (data.removeImages) {
      await deleteReviewImages(existing.imageUrls);
      imageUrls = [];
    } else if (data.keepImageUrls) {
      const allowed = new Set(existing.imageUrls);
      const keep = data.keepImageUrls.filter((url) => allowed.has(url));
      const removed = existing.imageUrls.filter((url) => !keep.includes(url));
      if (removed.length > 0) await deleteReviewImages(removed);
      imageUrls = keep;
    }

    const updated = await prisma.customerReview.update({
      where: { id },
      data: {
        ...(data.content !== undefined && { content: data.content.trim() }),
        ...(data.status !== undefined && { status: data.status as ReviewStatus }),
        ...(data.guestName !== undefined && { guestName: data.guestName.trim() }),
        ...(data.guestPhone !== undefined && { guestPhone: data.guestPhone }),
        ...(data.guestEmail !== undefined && {
          guestEmail: data.guestEmail.trim().toLowerCase(),
        }),
        ...((data.removeImages || data.keepImageUrls) && { imageUrls }),
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (e instanceof AdminForbiddenError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
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
    const session = await requireStaffContentAccess();
    const { id } = await params;
    const existing = await prisma.customerReview.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }
    assertCanManageStaffContent(actorFromSession(session), existing);
    await deleteReviewImages(existing.imageUrls);
    await prisma.customerReview.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (e instanceof AdminForbiddenError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
    return NextResponse.json({ error: "Silinemedi." }, { status: 400 });
  }
}
