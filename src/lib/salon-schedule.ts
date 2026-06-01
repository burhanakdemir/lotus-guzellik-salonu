import { getBlockedSlotsForDate, type BlockedTimeSlotRow } from "@/lib/blocked-slots";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SALON_SETTINGS, getSalonSettingsSafe } from "@/lib/db-safe";
import { getDayOfWeek } from "@/lib/timezone";
import { getWorkHoursForDay } from "@/lib/utils";
import { minutesToTime, timeToMinutes } from "@/lib/time-format";

export type SalonDaySchedule = {
  date: string;
  closed: boolean;
  reason?: string;
  open?: string;
  close?: string;
  slotInterval: number;
  slots: string[];
  markedClosed?: boolean;
  closedReason?: string | null;
  blockedSlots?: BlockedTimeSlotRow[];
};

export async function getSalonDaySchedule(
  date: string,
  staffId?: string | null
): Promise<SalonDaySchedule> {
  const settings = (await getSalonSettingsSafe()) ?? DEFAULT_SALON_SETTINGS;
  const closedDay = await prisma.closedDay.findUnique({ where: { date } });
  const hours = getWorkHoursForDay(getDayOfWeek(date), settings);

  const blockedSlots = await getBlockedSlotsForDate(date, staffId);

  if (!hours) {
    return {
      date,
      closed: true,
      reason: "Bu gün çalışma saati tanımlı değil",
      slotInterval: settings.slotInterval,
      slots: [],
      markedClosed: !!closedDay,
      closedReason: closedDay?.reason ?? null,
      blockedSlots,
    };
  }

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  const slots: string[] = [];
  for (let t = openMin; t < closeMin; t += settings.slotInterval) {
    slots.push(minutesToTime(t));
  }

  return {
    date,
    closed: false,
    open: hours.open,
    close: hours.close,
    slotInterval: settings.slotInterval,
    slots,
    markedClosed: !!closedDay,
    closedReason: closedDay?.reason ?? null,
    blockedSlots,
  };
}
