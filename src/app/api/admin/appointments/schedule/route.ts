import { NextResponse } from "next/server";
import { requireAppointmentAccess } from "@/lib/auth";
import { getSalonDaySchedule } from "@/lib/salon-schedule";

export async function GET(req: Request) {
  try {
    await requireAppointmentAccess();
    const date = new URL(req.url).searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
    }

    const staffId = new URL(req.url).searchParams.get("staffId");
    const schedule = await getSalonDaySchedule(
      date,
      staffId || undefined
    );
    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}
