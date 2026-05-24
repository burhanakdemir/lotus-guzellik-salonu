import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  GUEST_MAX_REVIEW_IMAGES,
  MEMBER_MAX_REVIEW_IMAGES,
  parseReviewImageFiles,
  saveReviewImages,
  validateReviewImageFiles,
} from "@/lib/reviews";
import { normalizePhone } from "@/lib/utils";
import { z } from "zod";

const guestSchema = z.object({
  content: z.string().min(10, "Yorum en az 10 karakter olmalı.").max(2000),
  guestName: z.string().min(2, "Ad soyad en az 2 karakter olmalı."),
  guestPhone: z
    .string()
    .transform((p) => normalizePhone(p))
    .refine((p) => p.length === 10, "Geçerli telefon girin."),
  guestEmail: z.string().email("Geçerli e-posta girin."),
});

const memberSchema = z.object({
  content: z.string().min(10, "Yorum en az 10 karakter olmalı.").max(2000),
});

export async function GET() {
  const reviews = await prisma.customerReview.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      imageUrls: true,
      createdAt: true,
      user: { select: { name: true } },
      guestName: true,
    },
  });

  return NextResponse.json(
    reviews.map((r) => ({
      id: r.id,
      content: r.content,
      imageUrls: r.imageUrls,
      createdAt: r.createdAt.toISOString(),
      authorName: r.user?.name ?? r.guestName ?? "Misafir",
    }))
  );
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const content = String(formData.get("content") ?? "").trim();
    const imageFiles = parseReviewImageFiles(formData);
    const session = await getSession();

    if (session?.role === "MEMBER") {
      const imageError = validateReviewImageFiles(imageFiles, MEMBER_MAX_REVIEW_IMAGES);
      if (imageError) {
        return NextResponse.json({ error: imageError }, { status: 400 });
      }

      const data = memberSchema.parse({ content });
      const member = await prisma.user.findFirst({
        where: { id: session.id, role: "MEMBER", isActive: true },
      });
      if (!member) {
        return NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 });
      }

      const review = await prisma.customerReview.create({
        data: {
          content: data.content.trim(),
          userId: member.id,
          status: "PENDING",
        },
      });

      if (imageFiles.length > 0) {
        const imageUrls = await saveReviewImages(review.id, imageFiles);
        await prisma.customerReview.update({
          where: { id: review.id },
          data: { imageUrls },
        });
      }

      return NextResponse.json({
        ok: true,
        message: "Yorumunuz alındı. Onaylandıktan sonra yayınlanacaktır.",
        id: review.id,
      });
    }

    const imageError = validateReviewImageFiles(imageFiles, GUEST_MAX_REVIEW_IMAGES);
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    const data = guestSchema.parse({
      content,
      guestName: String(formData.get("guestName") ?? "").trim(),
      guestPhone: String(formData.get("guestPhone") ?? ""),
      guestEmail: String(formData.get("guestEmail") ?? "").trim(),
    });

    const review = await prisma.customerReview.create({
      data: {
        content: data.content.trim(),
        guestName: data.guestName.trim(),
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail.trim().toLowerCase(),
        status: "PENDING",
      },
    });

    if (imageFiles.length > 0) {
      const imageUrls = await saveReviewImages(review.id, imageFiles);
      await prisma.customerReview.update({
        where: { id: review.id },
        data: { imageUrls },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Yorumunuz alındı. Onaylandıktan sonra yayınlanacaktır.",
      id: review.id,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.errors[0]?.message ?? "Geçersiz veri." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Yorum gönderilemedi." }, { status: 500 });
  }
}
