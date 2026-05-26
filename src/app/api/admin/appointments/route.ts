import { NextResponse } from "next/server";
import { AdminUnauthorizedError } from "@/lib/admin-permissions";
import { requireAppointmentAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureMemberAccount } from "@/lib/member-account";
import { staffCanPerformService } from "@/lib/staff-services";
import { isStaffAdmin, isSuperAdmin } from "@/lib/staff-admin";
import { normalizePhone, timeToMinutes, minutesToTime } from "@/lib/utils";
import {
  appointmentWithMemberInclude,
  mapAdminAppointments,
} from "@/lib/admin-appointments-loader";
import { getAppointmentStaffFilter } from "@/lib/admin-appointment-status";
import { getAvailableSlots } from "@/lib/slots";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const session = await requireAppointmentAccess();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const staffFilter = getAppointmentStaffFilter(session);

    if (!date && !(from && to)) {
      return NextResponse.json(
        { error: "date veya from+to parametreleri gerekli." },
        { status: 400 }
      );
    }

    const dateFilter = date
      ? { date }
      : { date: { gte: from!, lte: to! } };

    const appointments = await prisma.appointment.findMany({
      where: { ...dateFilter, ...staffFilter },
      include: appointmentWithMemberInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 1000,
    });
    return NextResponse.json(await mapAdminAppointments(appointments));
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

const createSchema = z.object({
  name: z.string(),
  phone: z.string(),
  serviceId: z.string(),
  date: z.string(),
  startTime: z.string(),
  note: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  userId: z.string().optional(),
  assignedStaffId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireAppointmentAccess();
    const data = createSchema.parse(await req.json());
    const phone = normalizePhone(data.phone);
    if (phone.length !== 10) {
      return NextResponse.json({ error: "Geçerli telefon girin." }, { status: 400 });
    }

    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, deletedAt: null },
    });
    if (!service) {
      return NextResponse.json({ error: "Hizmet bulunamadı." }, { status: 404 });
    }

    if (!/^\d{2}:\d{2}$/.test(data.startTime)) {
      return NextResponse.json({ error: "Geçersiz saat." }, { status: 400 });
    }

    let assignedStaffId: string | null = null;
    if (isSuperAdmin(session.role)) {
      assignedStaffId = data.assignedStaffId ?? null;
    } else if (isStaffAdmin(session.role)) {
      assignedStaffId = session.staffProfileId ?? null;
    }

    if (assignedStaffId) {
      const canDo = await staffCanPerformService(
        assignedStaffId,
        data.serviceId
      );
      if (!canDo) {
        return NextResponse.json(
          { error: "Bu usta seçilen hizmeti yapmamaktadır." },
          { status: 400 }
        );
      }
    }

    const endTime = minutesToTime(
      timeToMinutes(data.startTime) + service.durationMinutes
    );

    const slotCheck = await getAvailableSlots(
      data.date,
      data.serviceId,
      undefined,
      assignedStaffId ?? undefined
    );
    if (!slotCheck.slots.includes(data.startTime)) {
      return NextResponse.json(
        { error: slotCheck.error || "Seçilen saat müsait değil." },
        { status: 400 }
      );
    }

    const { userId: linkedUserId, created: memberCreated } =
      await ensureMemberAccount({
        name: data.name,
        phone,
        existingUserId: data.userId ?? null,
      });

    const autoConfirm = isSuperAdmin(session.role);
    const initialStatus = autoConfirm
      ? data.status || "CONFIRMED"
      : "PENDING";

    const apt = await prisma.appointment.create({
      data: {
        name: data.name.trim(),
        phone,
        userId: linkedUserId,
        serviceId: data.serviceId,
        assignedStaffId,
        date: data.date,
        startTime: data.startTime,
        endTime,
        note: data.note?.trim() || null,
        status: initialStatus,
        ...(autoConfirm && initialStatus === "CONFIRMED"
          ? {
              staffApprovedAt: new Date(),
              staffApprovedByUserId: session.id,
            }
          : {}),
      },
      include: appointmentWithMemberInclude,
    });

    if (initialStatus === "PENDING") {
      const { notifyStaffOfNewAppointment } = await import("@/lib/staff-notifications");
      await notifyStaffOfNewAppointment({
        id: apt.id,
        name: apt.name,
        phone: apt.phone,
        date: apt.date,
        startTime: apt.startTime,
        endTime: apt.endTime,
        assignedStaffId: apt.assignedStaffId,
        service: { name: apt.service.name },
        assignedStaff: apt.assignedStaff
          ? {
              id: apt.assignedStaff.id,
              label: apt.assignedStaff.label,
              userId: apt.assignedStaff.userId,
            }
          : null,
      }).catch(() => {});
    }

    const [mapped] = await mapAdminAppointments([apt]);
    return NextResponse.json({ appointment: mapped, memberCreated });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    const msg = e instanceof Error ? e.message : "";
    return NextResponse.json(
      { error: msg || "Oluşturulamadı" },
      { status: 400 }
    );
  }
}
