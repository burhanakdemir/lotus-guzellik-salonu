import { bookingBlockMinutes } from "@/lib/appointment-booking-duration";
import {
  blockAppliesToStaff,
  getBlockedSlotsForDate,
  timeRangesOverlap,
} from "@/lib/blocked-slots";
import { prisma } from "./prisma";
import { formatInTimeZone } from "date-fns-tz";
import { getDayOfWeek, todayString, TZ } from "./timezone";
import { getWorkHoursForDay, minutesToTime, timeToMinutes } from "./utils";

export type BookingSlotStatus = "available" | "full" | "past";

export type BookingSlotOption = {
  time: string;
  status: BookingSlotStatus;
};

type SlotBuildResult =
  | { ok: true; options: BookingSlotOption[] }
  | { ok: false; error: string };

async function buildDaySlotOptions(
  date: string,
  serviceId: string,
  assignedStaffId?: string,
  excludeAppointmentId?: string
): Promise<SlotBuildResult> {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, isActive: true, deletedAt: null },
  });
  if (!service) return { ok: false, error: "Hizmet bulunamadı." };

  if (date < todayString()) {
    return { ok: false, error: "Geçmiş bir tarih seçilemez." };
  }

  const closed = await prisma.closedDay.findUnique({ where: { date } });
  if (closed) return { ok: false, error: "Bu gün salon kapalı." };

  const settings = await prisma.salonSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) return { ok: false, error: "Salon ayarları bulunamadı." };

  const dayIndex = getDayOfWeek(date);
  const hours = getWorkHoursForDay(dayIndex, settings);
  if (!hours) return { ok: false, error: "Bu gün çalışma saati yok." };

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  const interval = settings.slotInterval;
  const blockMinutes = bookingBlockMinutes(settings, service);

  const appointments = await prisma.appointment.findMany({
    where: {
      date,
      status: { in: ["PENDING", "CONFIRMED"] },
      ...(assignedStaffId ? { assignedStaffId } : {}),
    },
    select: { id: true, startTime: true, endTime: true },
  });

  const blockedSlots = await getBlockedSlotsForDate(date, assignedStaffId ?? null);
  const relevantBlocks = blockedSlots.filter((b) =>
    blockAppliesToStaff(b, assignedStaffId ?? null)
  );

  const isToday = date === todayString();
  const nowMin = isToday
    ? timeToMinutes(formatInTimeZone(new Date(), TZ, "HH:mm"))
    : -1;

  const options: BookingSlotOption[] = [];
  for (let start = openMin; start + blockMinutes <= closeMin; start += interval) {
    const end = start + blockMinutes;
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    const overlapsAppointment = appointments.some((apt) => {
      if (excludeAppointmentId && apt.id === excludeAppointmentId) {
        return false;
      }
      return timeRangesOverlap(startTime, endTime, apt.startTime, apt.endTime);
    });

    const overlapsBlock = relevantBlocks.some((b) =>
      timeRangesOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    let status: BookingSlotStatus = "available";
    if (overlapsAppointment || overlapsBlock) {
      status = "full";
    } else if (isToday && start <= nowMin) {
      status = "past";
    }

    options.push({ time: startTime, status });
  }

  if (options.length === 0) {
    return { ok: false, error: "Bu gün için tanımlı saat yok." };
  }

  return { ok: true, options };
}

/** Müşteri randevu formu — tüm saatler; dolu olanlar işaretli */
export async function getBookingSlotGrid(
  date: string,
  serviceId: string,
  assignedStaffId?: string,
  excludeAppointmentId?: string
): Promise<{ slots: BookingSlotOption[]; error?: string }> {
  const built = await buildDaySlotOptions(
    date,
    serviceId,
    assignedStaffId,
    excludeAppointmentId
  );
  if (!built.ok) return { slots: [], error: built.error };
  return { slots: built.options };
}

export async function getAvailableSlots(
  date: string,
  serviceId: string,
  assignedStaffId?: string,
  excludeAppointmentId?: string
): Promise<{ slots: string[]; error?: string }> {
  const built = await buildDaySlotOptions(
    date,
    serviceId,
    assignedStaffId,
    excludeAppointmentId
  );
  if (!built.ok) return { slots: [], error: built.error };

  const available = built.options
    .filter((o) => o.status === "available")
    .map((o) => o.time);

  if (available.length === 0) {
    const hasFutureFull = built.options.some(
      (o) => o.status === "full" || o.status === "past"
    );
    return {
      slots: [],
      error: hasFutureFull
        ? date === todayString()
          ? "Bugün için müsait saat kalmadı."
          : "Bu tarih için müsait saat yok."
        : "Bu tarih için müsait saat yok.",
    };
  }

  return { slots: available };
}
