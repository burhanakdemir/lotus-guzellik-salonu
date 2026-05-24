import { NextResponse } from "next/server";
import { AdminUnauthorizedError } from "@/lib/admin-permissions";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getServiceIdsForStaff,
  setStaffServices,
} from "@/lib/staff-services";
import { isMultiAdminEnabled } from "@/lib/staff-admin";
import { z } from "zod";

const patchSchema = z.object({
  serviceIds: z.array(z.string()),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    if (!isMultiAdminEnabled()) {
      return NextResponse.json({ error: "Çoklu admin kapalı." }, { status: 403 });
    }

    const { id } = await params;
    const staff = await prisma.staffAdminProfile.findUnique({
      where: { id },
      select: { id: true, label: true },
    });
    if (!staff) {
      return NextResponse.json({ error: "Usta bulunamadı." }, { status: 404 });
    }

    const serviceIds = await getServiceIdsForStaff(id);
    const services = await prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true },
    });

    return NextResponse.json({
      staffId: id,
      serviceIds: serviceIds ?? [],
      allServicesAllowed: serviceIds === null,
      services,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    return NextResponse.json({ error: "Yüklenemedi" }, { status: 500 });
  }
}

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
    const { serviceIds } = patchSchema.parse(await req.json());

    const staff = await prisma.staffAdminProfile.findUnique({ where: { id } });
    if (!staff) {
      return NextResponse.json({ error: "Usta bulunamadı." }, { status: 404 });
    }

    const valid = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    const validIds = valid.map((s) => s.id);

    await setStaffServices(id, validIds);

    return NextResponse.json({
      ok: true,
      serviceIds: validIds,
      allServicesAllowed: validIds.length === 0,
    });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
    }
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 400 });
  }
}
