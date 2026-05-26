import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
  showPricePublic: z.boolean().optional(),
  showPriceOnHomepage: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = updateSchema.parse(await req.json());
    const service = await prisma.service.update({ where: { id }, data });
    return NextResponse.json(service);
  } catch {
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.service.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Silinemedi" }, { status: 400 });
  }
}
