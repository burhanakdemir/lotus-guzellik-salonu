import { NextResponse } from "next/server";
import {
  AdminForbiddenError,
  AdminUnauthorizedError,
  actorFromSession,
  assertCanEditAppointment,
} from "@/lib/admin-permissions";
import {
  appointmentWithMemberInclude,
  mapAdminAppointments,
} from "@/lib/admin-appointments-loader";
import { approveAppointment } from "@/lib/appointment-approval";
import { requireAppointmentAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { staffCanPerformService } from "@/lib/staff-services";
import { getAvailableSlots } from "@/lib/slots";
import { isSuperAdmin } from "@/lib/staff-admin";
import { minutesToTime, timeToMinutes } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  note: z.string().nullable().optional(),
  assignedStaffId: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  serviceId: z.string().optional(),
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
      date?: string;
      startTime?: string;
      endTime?: string;
      serviceId?: string;
    } = {};

    if (data.status !== undefined) {
      if (data.status === "CONFIRMED" && existing.status === "PENDING") {
        const result = await approveAppointment(
          id,
          session.id,
          actorFromSession(session)
        );
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 403 });
        }
      } else if (
        !isSuperAdmin(session.role) &&
        data.status === "CONFIRMED" &&
        existing.status !== "CONFIRMED"
      ) {
        return NextResponse.json(
          { error: "Onay için «Randevu Onayla» kullanın." },
          { status: 400 }
        );
      } else {
        updateData.status = data.status;
        if (data.status === "CONFIRMED" && !existing.staffApprovedAt) {
          (updateData as typeof updateData & {
            staffApprovedAt?: Date;
            staffApprovedByUserId?: string;
          }).staffApprovedAt = new Date();
          (updateData as typeof updateData & {
            staffApprovedByUserId?: string;
          }).staffApprovedByUserId = session.id;
        }
      }
    }
    if (data.note !== undefined) updateData.note = data.note;
    if (data.assignedStaffId !== undefined && isSuperAdmin(session.role)) {
      updateData.assignedStaffId = data.assignedStaffId;
    }

    const nextDate = data.date ?? existing.date;
    const nextServiceId = data.serviceId ?? existing.serviceId;
    const nextStartTime = data.startTime ?? existing.startTime;

    if (
      data.date !== undefined ||
      data.startTime !== undefined ||
      data.serviceId !== undefined
    ) {
      const service = await prisma.service.findFirst({
        where: { id: nextServiceId, deletedAt: null },
      });
      if (!service) {
        return NextResponse.json({ error: "Hizmet bulunamadı." }, { status: 404 });
      }

      const staffId = existing.assignedStaffId;
      if (staffId) {
        const canDo = await staffCanPerformService(staffId, nextServiceId);
        if (!canDo) {
          return NextResponse.json(
            { error: "Bu usta seçilen hizmeti yapmamaktadır." },
            { status: 400 }
          );
        }
      }

      const { slots, error: slotError } = await getAvailableSlots(
        nextDate,
        nextServiceId,
        undefined,
        staffId ?? undefined,
        id
      );
      if (slotError) {
        return NextResponse.json({ error: slotError }, { status: 400 });
      }
      if (!slots.includes(nextStartTime)) {
        return NextResponse.json(
          { error: "Seçilen saat müsait değil." },
          { status: 400 }
        );
      }

      updateData.date = nextDate;
      updateData.startTime = nextStartTime;
      updateData.endTime = minutesToTime(
        timeToMinutes(nextStartTime) + service.durationMinutes
      );
      updateData.serviceId = nextServiceId;
    }

    const apt = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: appointmentWithMemberInclude,
    });
    const [mapped] = await mapAdminAppointments([apt]);
    return NextResponse.json(mapped);
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
