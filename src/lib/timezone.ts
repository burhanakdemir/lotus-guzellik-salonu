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

/** Randevu bitiş saati geçmiş mi (İstanbul) */
export function isAppointmentInPast(date: string, endTime: string): boolean {
  const today = todayString();
  if (date < today) return true;
  if (date > today) return false;
  const nowTime = formatInTimeZone(new Date(), TZ, "HH:mm");
  return endTime <= nowTime;
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return toZonedTime(new Date(y, m - 1, d, 12, 0, 0), TZ);
}

/** 0 = Pazar … 6 = Cumartesi (sunucu saat diliminden bağımsız) */
export function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
