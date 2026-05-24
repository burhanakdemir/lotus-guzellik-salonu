import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();
    const promotions = await prisma.promotion.findMany({
      include: { services: { include: { service: true } } },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json(promotions);
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

const schema = z.object({
  title: z.string(),
  description: z.string(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive(),
  startDate: z.string(),
  endDate: z.string(),
  allServices: z.boolean(),
  serviceIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  bannerUrl: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = schema.parse(await req.json());
    if (!data.allServices && (!data.serviceIds || data.serviceIds.length === 0)) {
      return NextResponse.json(
        { error: "En az bir hizmet seçilmelidir." },
        { status: 400 }
      );
    }
    const promotion = await prisma.promotion.create({
      data: {
        title: data.title,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        allServices: data.allServices,
        isActive: data.isActive ?? true,
        bannerUrl: data.bannerUrl ?? null,
        services: data.allServices
          ? undefined
          : {
              create: (data.serviceIds || []).map((serviceId) => ({
                serviceId,
              })),
            },
      },
      include: { services: true },
    });
    return NextResponse.json(promotion);
  } catch {
    return NextResponse.json({ error: "Oluşturulamadı" }, { status: 400 });
  }
}
