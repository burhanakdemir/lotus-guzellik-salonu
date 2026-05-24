import { NextResponse } from "next/server";
import {
  AdminForbiddenError,
  AdminUnauthorizedError,
  actorFromSession,
  assertCanEditAppointment,
} from "@/lib/admin-permissions";
import { requireAppointmentAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/staff-admin";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  note: z.string().nullable().optional(),
  assignedStaffId: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppointmentAccess();
    const { id } = await params;
    const data = schema.parse(await req.json());

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Randevu bulunamadı." }, { status: 404 });
    }

    assertCanEditAppointment(actorFromSession(session), existing);

    const updateData: {
      status?: typeof data.status;
      note?: string | null;
      assignedStaffId?: string | null;
    } = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.assignedStaffId !== undefined && isSuperAdmin(session.role)) {
      updateData.assignedStaffId = data.assignedStaffId;
    }

    const apt = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        assignedStaff: { select: { id: true, slug: true, label: true, color: true } },
      },
    });
    return NextResponse.json(apt);
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Oturum süresi dolmuş. Yeniden giriş yapın." }, { status: 401 });
    }
    if (e instanceof AdminForbiddenError) {
      return NextResponse.json(
        { error: "Bu randevuyu düzenleme yetkiniz yok." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 400 });
  }
}
