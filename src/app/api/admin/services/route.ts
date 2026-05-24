import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  category: z.string(),
  description: z.string(),
  durationMinutes: z.number().int().positive(),
  price: z.number().positive(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const services = await prisma.service.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(services);
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);
    let slug = slugify(data.name);
    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const service = await prisma.service.create({
      data: {
        ...data,
        slug,
        isFeatured: data.isFeatured ?? false,
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json(service);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Oluşturulamadı" }, { status: 400 });
  }
}
