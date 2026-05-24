import { NextResponse } from "next/server";
import { requireAdmin, requireAppointmentAccess } from "@/lib/auth";
import { DEFAULT_MEMBER_PASSWORD } from "@/lib/member-constants";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    await requireAppointmentAccess();
    const q = (new URL(req.url).searchParams.get("q") || "").trim();
    const digits = q ? normalizePhone(q) : "";

    const phoneFilters =
      digits.length >= 3
        ? [
            { phone: { contains: digits } },
            { phone: { contains: `0${digits}` } },
            { phone: { contains: `90${digits}` } },
          ]
        : [];

    const members = await prisma.user.findMany({
      where: {
        role: "MEMBER",
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
                ...phoneFilters,
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: q ? 50 : 200,
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
    return NextResponse.json(members);
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  password: z.string().min(6).optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = createSchema.parse(await req.json());
    const phone = normalizePhone(data.phone);
    if (phone.length !== 10) {
      return NextResponse.json({ error: "Geçerli telefon girin." }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { phone: `0${phone}` },
          { phone: `90${phone}` },
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu telefon numarası zaten kayıtlı." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        phone,
        passwordHash: await hashPassword(
          data.password?.trim() || DEFAULT_MEMBER_PASSWORD
        ),
        role: "MEMBER",
        isActive: true,
      },
      select: { id: true, name: true, phone: true, isActive: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Üye eklenemedi." }, { status: 400 });
  }
}
