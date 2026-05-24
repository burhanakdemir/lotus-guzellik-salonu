import { NextResponse } from "next/server";
import { AdminUnauthorizedError } from "@/lib/admin-permissions";
import { requireSuperAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  isMultiAdminEnabled,
  MAX_STAFF_ADMINS,
  normalizeStaffSlug,
  STAFF_PROFILE_COLORS,
} from "@/lib/staff-admin";
import { normalizePhone } from "@/lib/utils";
import { z } from "zod";

const staffSelect = {
  id: true,
  slug: true,
  label: true,
  color: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      isActive: true,
    },
  },
  _count: { select: { appointments: true, services: true } },
} as const;

export async function GET() {
  try {
    await requireSuperAdmin();
    if (!isMultiAdminEnabled()) {
      return NextResponse.json(
        { error: "Çoklu admin özelliği kapalı (MULTI_ADMIN_ENABLED)." },
        { status: 403 }
      );
    }

    const staff = await prisma.staffAdminProfile.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: staffSelect,
    });

    const activeCount = staff.filter((s) => s.isActive).length;

    return NextResponse.json({ staff, activeCount, maxActive: MAX_STAFF_ADMINS });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    return NextResponse.json({ error: "Yüklenemedi" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  label: z.string().min(2),
  phone: z.string().min(10),
  slug: z.string().min(2),
  password: z.string().min(6),
  color: z.string().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
});

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    if (!isMultiAdminEnabled()) {
      return NextResponse.json({ error: "Çoklu admin kapalı." }, { status: 403 });
    }

    const data = createSchema.parse(await req.json());
    const phone = normalizePhone(data.phone);
    if (phone.length !== 10) {
      return NextResponse.json({ error: "Geçerli telefon girin." }, { status: 400 });
    }

    const slug = normalizeStaffSlug(data.slug);
    if (slug.length < 2) {
      return NextResponse.json({ error: "Geçerli URL slug girin." }, { status: 400 });
    }

    const activeCount = await prisma.staffAdminProfile.count({
      where: { isActive: true },
    });
    if (activeCount >= MAX_STAFF_ADMINS) {
      return NextResponse.json(
        { error: `En fazla ${MAX_STAFF_ADMINS} aktif usta olabilir.` },
        { status: 400 }
      );
    }

    const existingPhone = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, { phone: `0${phone}` }, { phone: `90${phone}` }],
      },
    });
    if (existingPhone) {
      return NextResponse.json({ error: "Bu telefon zaten kayıtlı." }, { status: 409 });
    }

    const existingSlug = await prisma.staffAdminProfile.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      return NextResponse.json({ error: "Bu slug kullanılıyor." }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);
    const sortOrder =
      data.sortOrder ??
      (await prisma.staffAdminProfile.count()) + 1;
    const color =
      data.color ??
      STAFF_PROFILE_COLORS[activeCount % STAFF_PROFILE_COLORS.length];

    const profile = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name.trim(),
          phone,
          email: `${slug}@lotusguzellik.local`,
          passwordHash,
          role: "STAFF_ADMIN",
          isActive: true,
        },
      });

      return tx.staffAdminProfile.create({
        data: {
          userId: user.id,
          slug,
          label: data.label.trim(),
          color,
          sortOrder,
          isActive: true,
        },
        select: staffSelect,
      });
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
    }
    return NextResponse.json({ error: "Oluşturulamadı" }, { status: 400 });
  }
}
