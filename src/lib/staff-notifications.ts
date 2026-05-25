import { prisma } from "@/lib/prisma";
import { formatPhoneDisplay } from "@/lib/phone";

export async function deliverStaffNotification(input: {
  userId: string;
  staffId?: string | null;
  appointmentId?: string;
  title: string;
  body: string;
  link?: string;
}) {
  await prisma.staffNotification.create({
    data: {
      userId: input.userId,
      staffId: input.staffId ?? null,
      appointmentId: input.appointmentId ?? null,
      title: input.title.trim(),
      body: input.body.trim(),
      link: input.link ?? "/admin/randevular",
    },
  });
}

/** Yeni müşteri randevusu: atanan usta + tüm süper adminler */
export async function notifyStaffOfNewAppointment(appointment: {
  id: string;
  name: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedStaffId: string | null;
  service: { name: string };
  assignedStaff?: { id: string; label: string; userId: string } | null;
}) {
  const title = "Yeni randevu — onay bekliyor";
  const body = `${appointment.name} · ${formatPhoneDisplay(appointment.phone)} · ${
    appointment.service.name
  } · ${appointment.date} ${appointment.startTime}–${appointment.endTime}`;
  const link = `/admin/randevular`;

  const notified = new Set<string>();

  if (appointment.assignedStaff?.userId) {
    await deliverStaffNotification({
      userId: appointment.assignedStaff.userId,
      staffId: appointment.assignedStaff.id,
      appointmentId: appointment.id,
      title,
      body: `${body} (size atandı)`,
      link,
    });
    notified.add(appointment.assignedStaff.userId);
  } else if (appointment.assignedStaffId) {
    const staff = await prisma.staffAdminProfile.findUnique({
      where: { id: appointment.assignedStaffId },
      select: { id: true, userId: true },
    });
    if (staff && !notified.has(staff.userId)) {
      await deliverStaffNotification({
        userId: staff.userId,
        staffId: staff.id,
        appointmentId: appointment.id,
        title,
        body: `${body} (size atandı)`,
        link,
      });
      notified.add(staff.userId);
    }
  }

  const superAdmins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  for (const admin of superAdmins) {
    if (notified.has(admin.id)) continue;
    await deliverStaffNotification({
      userId: admin.id,
      staffId: null,
      appointmentId: appointment.id,
      title,
      body,
      link,
    });
    notified.add(admin.id);
  }
}

export async function getStaffUnreadCount(userId: string): Promise<number> {
  return prisma.staffNotification.count({
    where: { userId, readAt: null },
  });
}
