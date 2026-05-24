import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { tr } from "date-fns/locale";

export type CalendarView = "month" | "week" | "day";

const weekOpts = { weekStartsOn: 1 as const };

export function toDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function getMonthGridDays(cursor: Date): Date[] {
  const start = startOfWeek(startOfMonth(cursor), weekOpts);
  const end = endOfWeek(endOfMonth(cursor), weekOpts);
  return eachDayOfInterval({ start, end });
}

export function getWeekDays(cursor: Date): Date[] {
  const start = startOfWeek(cursor, weekOpts);
  const end = endOfWeek(cursor, weekOpts);
  return eachDayOfInterval({ start, end });
}

export function getViewRange(
  view: CalendarView,
  cursor: Date
): { from: string; to: string } {
  if (view === "day") {
    const key = toDateKey(cursor);
    return { from: key, to: key };
  }
  if (view === "week") {
    const days = getWeekDays(cursor);
    return { from: toDateKey(days[0]), to: toDateKey(days[days.length - 1]) };
  }
  const days = getMonthGridDays(cursor);
  return {
    from: toDateKey(days[0]),
    to: toDateKey(days[days.length - 1]),
  };
}

export function navigateCursor(
  view: CalendarView,
  cursor: Date,
  direction: -1 | 1
): Date {
  if (view === "day") return addDays(cursor, direction);
  if (view === "week") return addWeeks(cursor, direction);
  return addMonths(cursor, direction);
}

export function formatCalendarTitle(view: CalendarView, cursor: Date): string {
  if (view === "day") {
    return format(cursor, "d MMMM yyyy, EEEE", { locale: tr });
  }
  if (view === "week") {
    const days = getWeekDays(cursor);
    const start = days[0];
    const end = days[6];
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, "d")} – ${format(end, "d MMMM yyyy", { locale: tr })}`;
    }
    return `${format(start, "d MMM", { locale: tr })} – ${format(end, "d MMM yyyy", { locale: tr })}`;
  }
  return format(cursor, "MMMM yyyy", { locale: tr });
}

export const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
