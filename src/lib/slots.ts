import { prisma } from "./prisma";
import { getDayOfWeek, todayString } from "./timezone";
import { getWorkHoursForDay, minutesToTime, normalizePhone, timeToMinutes } from "./utils";

export async function getAvailableSlots(
  date: string,
  serviceId: string,
  phone?: string,
  assignedStaffId?: string
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
  const duration = service.durationMinutes;
  const interval = settings.slotInterval;

  const appointments = await prisma.appointment.findMany({
    where: {
      date,
      status: { in: ["PENDING", "CONFIRMED"] },
      ...(assignedStaffId ? { assignedStaffId } : {}),
    },
  });

  const slots: string[] = [];
  for (let start = openMin; start + duration <= closeMin; start += interval) {
    const end = start + duration;
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    const overlaps = appointments.some((apt) => {
      const aptStart = timeToMinutes(apt.startTime);
      const aptEnd = timeToMinutes(apt.endTime);
      return start < aptEnd && end > aptStart;
    });

    if (!overlaps) slots.push(startTime);
  }

  if (phone) {
    const normalized = normalizePhone(phone);
    if (normalized.length === 10) {
      const userAppts = await prisma.appointment.findMany({
        where: {
          date,
          phone: normalized,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });
      if (userAppts.length > 0) {
        return {
          slots: [],
          error: "Bu telefon numarasıyla aynı gün için zaten randevu var.",
        };
      }
    }
  }

  return { slots };
}
