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

/** Onaylı veya bekleyen randevuyu iptal (usta / süper admin, kendi ataması) */
export async function cancelAppointment(
  appointmentId: string,
  actor: AppointmentActor
): Promise<{ error?: string }> {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true },
  });
  if (!existing) return { error: "Randevu bulunamadı." };
  if (!canEditAppointment(actor, existing)) {
    return { error: "Bu randevuyu iptal etme yetkiniz yok." };
  }
  if (existing.status === "CANCELLED") {
    return { error: "Randevu zaten iptal edilmiş." };
  }
  if (existing.status === "COMPLETED") {
    return { error: "Tamamlanmış randevu iptal edilemez." };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });

  if (existing.userId) {
    const wasConfirmed = existing.status === "CONFIRMED";
    await deliverMemberNotifications({
      userIds: [existing.userId],
      title: wasConfirmed ? "Randevunuz iptal edildi" : "Randevu talebiniz iptal edildi",
      body: wasConfirmed
        ? `${existing.service.name} · ${existing.date} ${existing.startTime} randevusu iptal edildi.`
        : `${existing.service.name} · ${existing.date} ${existing.startTime} — talep iptal edildi.`,
      kind: "INFO",
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
