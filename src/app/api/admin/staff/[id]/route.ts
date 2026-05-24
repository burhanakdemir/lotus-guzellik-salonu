import { NextResponse } from "next/server";
import { AdminUnauthorizedError } from "@/lib/admin-permissions";
import { requireSuperAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  isMultiAdminEnabled,
  MAX_STAFF_ADMINS,
  normalizeStaffSlug,
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
  user: {
    select: {
      id: true,
      name: true,
      phone: true,
      isActive: true,
    },
  },
  _count: { select: { appointments: true } },
} as const;

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  label: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  slug: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  color: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    if (!isMultiAdminEnabled()) {
      return NextResponse.json({ error: "Çoklu admin kapalı." }, { status: 403 });
    }

    const { id } = await params;
    const data = patchSchema.parse(await req.json());

    const existing = await prisma.staffAdminProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Usta bulunamadı." }, { status: 404 });
    }

    if (data.isActive === true && !existing.isActive) {
      const activeCount = await prisma.staffAdminProfile.count({
        where: { isActive: true, id: { not: id } },
      });
      if (activeCount >= MAX_STAFF_ADMINS) {
        return NextResponse.json(
          { error: `En fazla ${MAX_STAFF_ADMINS} aktif usta olabilir.` },
          { status: 400 }
        );
      }
    }

    let slug = existing.slug;
    if (data.slug !== undefined) {
      slug = normalizeStaffSlug(data.slug);
      if (slug.length < 2) {
        return NextResponse.json({ error: "Geçersiz slug." }, { status: 400 });
      }
      const slugTaken = await prisma.staffAdminProfile.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugTaken) {
        return NextResponse.json({ error: "Bu slug kullanılıyor." }, { status: 409 });
      }
    }

    let phone = existing.user.phone;
    if (data.phone !== undefined) {
      phone = normalizePhone(data.phone);
      if (phone.length !== 10) {
        return NextResponse.json({ error: "Geçerli telefon girin." }, { status: 400 });
      }
      const phoneTaken = await prisma.user.findFirst({
        where: {
          id: { not: existing.userId },
          OR: [{ phone }, { phone: `0${phone}` }, { phone: `90${phone}` }],
        },
      });
      if (phoneTaken) {
        return NextResponse.json({ error: "Bu telefon zaten kayıtlı." }, { status: 409 });
      }
    }

    const userUpdate: {
      name?: string;
      phone?: string;
      passwordHash?: string;
      isActive?: boolean;
    } = {};
    if (data.name !== undefined) userUpdate.name = data.name.trim();
    if (data.phone !== undefined) userUpdate.phone = phone;
    if (data.password) userUpdate.passwordHash = await hashPassword(data.password);
    if (data.isActive !== undefined) userUpdate.isActive = data.isActive;

    const profileUpdate: {
      slug?: string;
      label?: string;
      color?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    } = {};
    if (data.slug !== undefined) profileUpdate.slug = slug;
    if (data.label !== undefined) profileUpdate.label = data.label.trim();
    if (data.color !== undefined) profileUpdate.color = data.color;
    if (data.sortOrder !== undefined) profileUpdate.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) profileUpdate.isActive = data.isActive;

    const updated = await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userUpdate,
        });
      }
      return tx.staffAdminProfile.update({
        where: { id },
        data: profileUpdate,
        select: staffSelect,
      });
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
    }
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    if (!isMultiAdminEnabled()) {
      return NextResponse.json({ error: "Çoklu admin kapalı." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.staffAdminProfile.findUnique({
      where: { id },
      include: { _count: { select: { appointments: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Usta bulunamadı." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.staffAdminProfile.delete({ where: { id } });
      await tx.user.delete({ where: { id: existing.userId } });
    });

    return NextResponse.json({
      ok: true,
      deletedAppointmentsUnassigned: existing._count.appointments,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    return NextResponse.json({ error: "Silinemedi" }, { status: 400 });
  }
}
