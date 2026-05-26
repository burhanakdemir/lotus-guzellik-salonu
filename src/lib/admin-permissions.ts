import type { Role } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import {
  isMultiAdminEnabled,
  isStaffAdmin,
  isSuperAdmin,
} from "@/lib/staff-admin";

export type AppointmentActor = {
  role: SessionUser["role"];
  staffProfileId?: string | null;
};

export type AppointmentRecord = {
  assignedStaffId: string | null;
};

export class AdminForbiddenError extends Error {
  constructor(message = "FORBIDDEN") {
    super(message);
    this.name = "AdminForbiddenError";
  }
}

export class AdminUnauthorizedError extends Error {
  constructor(message = "UNAUTHORIZED") {
    super(message);
    this.name = "AdminUnauthorizedError";
  }
}

/** Süper admin — tam panel */
export function assertSuperAdmin(session: SessionUser | null): asserts session is SessionUser {
  if (!session || !isSuperAdmin(session.role)) {
    throw new AdminUnauthorizedError();
  }
}

/** Randevu modülü — süper veya yardımcı admin (bayrak açıkken) */
export function assertAppointmentAccess(session: SessionUser | null): asserts session is SessionUser {
  if (!session) throw new AdminUnauthorizedError();
  if (isSuperAdmin(session.role)) return;
  if (isMultiAdminEnabled() && isStaffAdmin(session.role)) {
    if (!session.staffProfileId) {
      throw new AdminUnauthorizedError();
    }
    return;
  }
  throw new AdminUnauthorizedError();
}

export function canEditAppointment(
  actor: AppointmentActor,
  appointment: AppointmentRecord
): boolean {
  if (isSuperAdmin(actor.role)) return true;
  if (!isMultiAdminEnabled() || !isStaffAdmin(actor.role)) return false;
  if (!actor.staffProfileId) return false;
  return appointment.assignedStaffId === actor.staffProfileId;
}

export function assertCanEditAppointment(
  actor: AppointmentActor,
  appointment: AppointmentRecord
): void {
  if (!canEditAppointment(actor, appointment)) {
    throw new AdminForbiddenError();
  }
}

/** Yardımcı adminin erişebileceği admin path'leri */
export function isStaffAdminPath(pathname: string): boolean {
  return (
    pathname === "/admin/randevular" ||
    pathname.startsWith("/admin/randevular/") ||
    pathname === "/admin/galeri" ||
    pathname.startsWith("/admin/galeri/") ||
    pathname === "/admin/yorumlar" ||
    pathname.startsWith("/admin/yorumlar/")
  );
}

export function staffPersonelPath(slug: string): string {
  return `/admin/randevular/personel/${slug}`;
}

export function actorFromSession(session: SessionUser): AppointmentActor {
  return {
    role: session.role,
    staffProfileId: session.staffProfileId ?? null,
  };
}

export function isAdminRole(role: Role): boolean {
  return isSuperAdmin(role) || (isMultiAdminEnabled() && isStaffAdmin(role));
}
