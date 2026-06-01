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

export async function getAvailableSlots(
  date: string,
  serviceId: string,
  assignedStaffId?: string,
  excludeAppointmentId?: string
): Promise<{ slots: string[]; error?: string }> {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, isActive: true, deletedAt: null },
  });
  if (!service) return { slots: [], error: "Hizmet bulunamadı." };

  if (date < todayString()) {
    return { slots: [], error: "Geçmiş bir tarih seçilemez." };
  }

  const closed = await prisma.closedDay.findUnique({ where: { date } });
  if (closed) return { slots: [], error: "Bu gün salon kapalı." };

  const settings = await prisma.salonSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) return { slots: [], error: "Salon ayarları bulunamadı." };

  const dayIndex = getDayOfWeek(date);
  const hours = getWorkHoursForDay(dayIndex, settings);
  if (!hours) return { slots: [], error: "Bu gün çalışma saati yok." };

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

  const slots: string[] = [];
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

    if (!overlapsAppointment && !overlapsBlock) slots.push(startTime);
  }

  let available = slots;
  if (date === todayString()) {
    const nowMin = timeToMinutes(formatInTimeZone(new Date(), TZ, "HH:mm"));
    available = slots.filter((t) => timeToMinutes(t) > nowMin);
    if (available.length === 0 && slots.length > 0) {
      return {
        slots: [],
        error: "Bugün için müsait saat kalmadı.",
      };
    }
  }

  if (available.length === 0) {
    return {
      slots: [],
      error:
        date === todayString()
          ? "Bugün için müsait saat kalmadı."
          : "Bu tarih için müsait saat yok.",
    };
  }

  return { slots: available };
}
