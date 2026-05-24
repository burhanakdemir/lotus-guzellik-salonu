import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive(),
  startDate: z.string(),
  endDate: z.string(),
  allServices: z.boolean(),
  serviceIds: z.array(z.string()).optional(),
  singleUse: z.boolean().optional(),
  maxUses: z.number().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: userId } = await params;
    const data = schema.parse(await req.json());

    const discount = await prisma.memberDiscount.create({
      data: {
        userId,
        title: data.title,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        allServices: data.allServices,
        singleUse: data.singleUse ?? false,
        maxUses: data.maxUses,
        services: data.allServices
          ? undefined
          : {
              create: (data.serviceIds || []).map((serviceId) => ({ serviceId })),
            },
      },
    });
    return NextResponse.json(discount);
  } catch {
    return NextResponse.json({ error: "Oluşturulamadı" }, { status: 400 });
  }
}
