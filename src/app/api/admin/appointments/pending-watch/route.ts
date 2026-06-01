import { NextResponse } from "next/server";
import { getAppointmentStaffFilter } from "@/lib/admin-appointment-status";
import { getSession, isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Admin paneli — yeni onay bekleyen randevu için hafif izleme */
export async function GET() {
  const session = await getSession();
  if (!session || !isAdminSession(session)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const staffFilter = getAppointmentStaffFilter(session);
  const where = { status: "PENDING" as const, ...staffFilter };

  const [pendingCount, latest] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findFirst({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    pendingCount,
    latestId: latest?.id ?? null,
    latestCreatedAt: latest?.createdAt?.toISOString() ?? null,
  });
}
