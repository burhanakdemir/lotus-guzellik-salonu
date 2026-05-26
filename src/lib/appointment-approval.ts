import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canEditAppointment, type AppointmentActor } from "@/lib/admin-permissions";
import { isSuperAdmin } from "@/lib/staff-admin";
import { deliverMemberNotifications } from "@/lib/member-notifications";
import { staffAdminProfileNameSelect } from "@/lib/staff-display-name";

export function pendingApprovalLabel(): string {
  return "Onay bekliyor";
}

export function isAwaitingStaffApproval(status: AppointmentStatus): boolean {
  return status === "PENDING";
}

export async function approveAppointment(
  appointmentId: string,
  actorUserId: string,
  actor: AppointmentActor
): Promise<{ error?: string }> {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true, assignedStaff: true },
  });
  if (!existing) return { error: "Randevu bulunamadı." };
  if (existing.status !== "PENDING") {
    return { error: "Bu randevu zaten işlenmiş." };
  }

  if (!canEditAppointment(actor, existing)) {
    return { error: "Bu randevuyu onaylama yetkiniz yok." };
  }

  if (
    !isSuperAdmin(actor.role) &&
    existing.assignedStaffId &&
    existing.assignedStaffId !== actor.staffProfileId
  ) {
    return { error: "Yalnızca size atanan randevuları onaylayabilirsiniz." };
  }

  if (
    !isSuperAdmin(actor.role) &&
    !existing.assignedStaffId &&
    actor.staffProfileId
  ) {
    return { error: "Atanmamış randevuyu onaylayamazsınız." };
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CONFIRMED",
      staffApprovedAt: new Date(),
      staffApprovedByUserId: actorUserId,
    },
    include: {
      service: true,
      assignedStaff: { select: staffAdminProfileNameSelect },
    },
  });

  if (updated.userId) {
    await deliverMemberNotifications({
      userIds: [updated.userId],
      title: "Randevunuz onaylandı",
      body: `${updated.service.name} · ${updated.date} ${updated.startTime} onaylandı.`,
      kind: "REMINDER",
    }).catch(() => {});
  }

  return {};
}

export async function rejectAppointment(
  appointmentId: string,
  actor: AppointmentActor
): Promise<{ error?: string }> {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true },
  });
  if (!existing) return { error: "Randevu bulunamadı." };
  if (!canEditAppointment(actor, existing)) {
    return { error: "Yetkisiz." };
  }
  if (existing.status !== "PENDING") {
    return { error: "Yalnızca bekleyen randevular reddedilebilir." };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });

  if (existing.userId) {
    await deliverMemberNotifications({
      userIds: [existing.userId],
      title: "Randevu talebi",
      body: `${existing.service.name} · ${existing.date} ${existing.startTime} — onaylanamadı.`,
      kind: "INFO",
    }).catch(() => {});
  }

  return {};
}
