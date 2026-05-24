import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";
import { z } from "zod";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await prisma.user.findFirst({
      where: { id, role: "MEMBER" },
      include: {
        appointments: {
          include: { service: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        discounts: {
          include: { services: { include: { service: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = patchSchema.parse(await req.json());

    const existing = await prisma.user.findFirst({
      where: { id, role: "MEMBER" },
    });
    if (!existing) {
      return NextResponse.json({ error: "Üye bulunamadı." }, { status: 404 });
    }

    const update: {
      isActive?: boolean;
      name?: string;
      phone?: string;
      passwordHash?: string;
    } = {};

    if (data.isActive !== undefined) update.isActive = data.isActive;
    if (data.name !== undefined) update.name = data.name.trim();

    if (data.phone !== undefined) {
      const phone = normalizePhone(data.phone);
      if (phone.length !== 10) {
        return NextResponse.json({ error: "Geçerli telefon girin." }, { status: 400 });
      }
      const conflict = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [{ phone }, { phone: `0${phone}` }, { phone: `90${phone}` }],
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Bu telefon başka bir hesapta kayıtlı." },
          { status: 409 }
        );
      }
      update.phone = phone;
    }

    if (data.password !== undefined) {
      update.passwordHash = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: update,
      select: { id: true, name: true, phone: true, isActive: true },
    });
    return NextResponse.json(user);
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

    const user = await prisma.user.findFirst({
      where: { id, role: "MEMBER" },
    });
    if (!user) {
      return NextResponse.json({ error: "Üye bulunamadı." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.appointment.updateMany({
        where: { userId: id },
        data: { userId: null },
      }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Silinemedi" }, { status: 400 });
  }
}
