import { getViewRange, parseDateKey } from "@/lib/calendar-dates";
import { prisma } from "@/lib/prisma";
import { todayString } from "@/lib/timezone";

export async function loadAdminAppointmentsData() {
  const today = todayString();
  const { from, to } = getViewRange("month", parseDateKey(today));
  const [appointments, services] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: { gte: from, lte: to } },
      include: {
        service: true,
        assignedStaff: { select: { id: true, slug: true, label: true, color: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, durationMinutes: true },
    }),
  ]);
  return { today, appointments, services };
}

export function mapAdminAppointments(
  appointments: Awaited<ReturnType<typeof loadAdminAppointmentsData>>["appointments"]
) {
  return appointments.map((a) => ({
    id: a.id,
    name: a.name,
    phone: a.phone,
    date: a.date,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    assignedStaffId: a.assignedStaffId,
    assignedStaff: a.assignedStaff,
    service: { name: a.service.name },
  }));
}
