import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const TZ = "Europe/Istanbul";

export function nowInIstanbul(): Date {
  return toZonedTime(new Date(), TZ);
}

export function formatDateTR(date: Date, pattern = "d MMMM yyyy, EEEE"): string {
  return formatInTimeZone(date, TZ, pattern, { locale: undefined });
}

export function todayString(): string {
  return formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return toZonedTime(new Date(y, m - 1, d, 12, 0, 0), TZ);
}

export function getDayOfWeek(dateStr: string): number {
  const d = parseDateString(dateStr);
  return d.getDay();
}
