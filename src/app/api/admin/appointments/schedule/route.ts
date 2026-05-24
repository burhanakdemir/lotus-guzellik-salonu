import { NextResponse } from "next/server";
import { requireAppointmentAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDayOfWeek } from "@/lib/timezone";
import { getWorkHoursForDay, minutesToTime, timeToMinutes } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    await requireAppointmentAccess();
    const date = new URL(req.url).searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
    }

    const settings = await prisma.salonSettings.findUnique({
      where: { id: "default" },
    });
    if (!settings) {
      return NextResponse.json({ error: "Salon ayarları yok" }, { status: 404 });
    }

    const closedDay = await prisma.closedDay.findUnique({ where: { date } });
    const hours = getWorkHoursForDay(getDayOfWeek(date), settings);
    if (!hours) {
      return NextResponse.json({
        date,
        closed: true,
        reason: "Bu gün çalışma saati tanımlı değil",
        slotInterval: settings.slotInterval,
        slots: [] as string[],
        markedClosed: !!closedDay,
      });
    }

    const openMin = timeToMinutes(hours.open);
    const closeMin = timeToMinutes(hours.close);
    const slots: string[] = [];
    for (let t = openMin; t < closeMin; t += settings.slotInterval) {
      slots.push(minutesToTime(t));
    }

    return NextResponse.json({
      date,
      closed: false,
      open: hours.open,
      close: hours.close,
      slotInterval: settings.slotInterval,
      slots,
      markedClosed: !!closedDay,
      closedReason: closedDay?.reason ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}
