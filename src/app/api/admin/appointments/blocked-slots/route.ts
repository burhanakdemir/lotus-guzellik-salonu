import { NextResponse } from "next/server";
import { AdminUnauthorizedError } from "@/lib/admin-permissions";
import {
  blockAppliesToStaff,
  getBlockedSlotsForDate,
  timeRangesOverlap,
} from "@/lib/blocked-slots";
import { requireAppointmentAccess } from "@/lib/auth";
import { DEFAULT_SALON_SETTINGS, getSalonSettingsSafe } from "@/lib/db-safe";
import { prisma } from "@/lib/prisma";
import { isStaffAdmin, isSuperAdmin } from "@/lib/staff-admin";
import { minutesToTime, timeToMinutes } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().max(200).optional(),
  assignedStaffId: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  try {
    await requireAppointmentAccess();
    const date = new URL(req.url).searchParams.get("date");
    const staffId = new URL(req.url).searchParams.get("staffId");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
    }
    const blocks = await getBlockedSlotsForDate(
      date,
      staffId || undefined
    );
    return NextResponse.json(blocks);
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAppointmentAccess();
    const data = createSchema.parse(await req.json());

    const settings = (await getSalonSettingsSafe()) ?? DEFAULT_SALON_SETTINGS;
    const endTime = minutesToTime(
      timeToMinutes(data.startTime) + settings.slotInterval
    );

    let assignedStaffId: string | null = null;
    if (isSuperAdmin(session.role)) {
      assignedStaffId = data.assignedStaffId ?? null;
    } else if (isStaffAdmin(session.role)) {
      assignedStaffId = session.staffProfileId ?? null;
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        date: data.date,
        status: { in: ["PENDING", "CONFIRMED"] },
        ...(assignedStaffId ? { assignedStaffId } : {}),
      },
      select: { startTime: true, endTime: true },
    });

    const hasAppointment = appointments.some((apt) =>
      timeRangesOverlap(
        data.startTime,
        endTime,
        apt.startTime,
        apt.endTime
      )
    );
    if (hasAppointment) {
      return NextResponse.json(
        { error: "Bu saatte zaten randevu var." },
        { status: 400 }
      );
    }

    const existing = await prisma.blockedTimeSlot.findMany({
      where: { date: data.date },
    });
    const overlapsBlock = existing.some(
      (b) =>
        blockAppliesToStaff(b, assignedStaffId) &&
        timeRangesOverlap(data.startTime, endTime, b.startTime, b.endTime)
    );
    if (overlapsBlock) {
      return NextResponse.json(
        { error: "Bu saat zaten kapalı." },
        { status: 400 }
      );
    }

    const block = await prisma.blockedTimeSlot.create({
      data: {
        date: data.date,
        startTime: data.startTime,
        endTime,
        assignedStaffId,
        reason: data.reason?.trim() || null,
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        assignedStaffId: true,
        reason: true,
      },
    });

    return NextResponse.json(block);
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
