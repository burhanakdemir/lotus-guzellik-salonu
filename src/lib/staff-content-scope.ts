import type { SessionUser } from "@/lib/auth";
import {
  AdminForbiddenError,
  AdminUnauthorizedError,
  type AppointmentActor,
  actorFromSession,
} from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import {
  getStaffDisplayName,
  staffAdminProfileNameSelect,
} from "@/lib/staff-display-name";
import { isMultiAdminEnabled, isStaffAdmin, isSuperAdmin } from "@/lib/staff-admin";

export type StaffContentRecord = {
  staffProfileId: string | null;
};

export type StaffContentFilter = {
  staffProfileId?: string;
};

/** Galeri / yorum modülü — süper admin veya kendi profili olan usta */
export function assertStaffContentAccess(
  session: SessionUser | null
): asserts session is SessionUser {
  if (!session) throw new AdminUnauthorizedError();
  if (isSuperAdmin(session.role)) return;
  if (isMultiAdminEnabled() && isStaffAdmin(session.role)) {
    if (!session.staffProfileId) throw new AdminUnauthorizedError();
    return;
  }
  throw new AdminUnauthorizedError();
}

export function canManageStaffContent(
  actor: AppointmentActor,
  record: StaffContentRecord
): boolean {
  if (isSuperAdmin(actor.role)) return true;
  if (!isMultiAdminEnabled() || !isStaffAdmin(actor.role)) return false;
  if (!actor.staffProfileId) return false;
  if (!record.staffProfileId) return false;
  return record.staffProfileId === actor.staffProfileId;
}

export function assertCanManageStaffContent(
  actor: AppointmentActor,
  record: StaffContentRecord
): void {
  if (!canManageStaffContent(actor, record)) {
    throw new AdminForbiddenError();
  }
}

export function getStaffContentFilter(session: SessionUser): StaffContentFilter {
  if (!isSuperAdmin(session.role) && session.staffProfileId) {
    return { staffProfileId: session.staffProfileId };
  }
  return {};
}

export async function resolveStaffContentScope(
  session: SessionUser,
  personelSlug?: string | null
) {
  const base = getStaffContentFilter(session);

  if (!personelSlug?.trim() || !isSuperAdmin(session.role)) {
    return {
      staffProfileId: base.staffProfileId ?? null,
      staffFilter: base,
      staffDisplayName: null as string | null,
      staffSlug: null as string | null,
    };
  }

  const profile = await prisma.staffAdminProfile.findFirst({
    where: { slug: personelSlug.trim(), isActive: true },
    select: staffAdminProfileNameSelect,
  });

  if (!profile) {
    return {
      staffProfileId: null,
      staffFilter: base,
      staffDisplayName: null,
      staffSlug: null,
    };
  }

  return {
    staffProfileId: profile.id,
    staffFilter: { staffProfileId: profile.id },
    staffDisplayName: getStaffDisplayName(profile),
    staffSlug: profile.slug,
  };
}

export async function loadActiveStaffForPublic() {
  const profiles = await prisma.staffAdminProfile.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: staffAdminProfileNameSelect,
  });
  return profiles.map((p) => ({
    id: p.id,
    slug: p.slug,
    label: getStaffDisplayName(p),
    color: p.color,
  }));
}

export async function findActiveStaffBySlug(slug: string) {
  const profile = await prisma.staffAdminProfile.findFirst({
    where: { slug, isActive: true },
    select: staffAdminProfileNameSelect,
  });
  if (!profile) return null;
  return {
    id: profile.id,
    slug: profile.slug,
    label: getStaffDisplayName(profile),
    color: profile.color,
  };
}

export { actorFromSession };
