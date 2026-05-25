import { NextResponse } from "next/server";
import { AdminUnauthorizedError } from "@/lib/admin-permissions";
import { requireAppointmentAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureMemberAccount } from "@/lib/member-account";
import { staffCanPerformService } from "@/lib/staff-services";
import { isStaffAdmin, isSuperAdmin } from "@/lib/staff-admin";
import { normalizePhone, timeToMinutes, minutesToTime } from "@/lib/utils";
import { z } from "zod";

const appointmentInclude = {
  service: true,
  user: true,
  assignedStaff: {
    select: { id: true, slug: true, label: true, color: true, userId: true },
  },
} as const;

export async function GET(req: Request) {
  try {
    await requireAppointmentAccess();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = date
      ? { date }
      : from && to
        ? { date: { gte: from, lte: to } }
        : from
          ? { date: { gte: from } }
          : to
            ? { date: { lte: to } }
            : {};
    const appointments = await prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    return NextResponse.json(appointments);
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
      include: appointmentInclude,
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

    return NextResponse.json({ appointment: apt, memberCreated });
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
