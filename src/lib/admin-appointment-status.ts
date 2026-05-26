import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStaffDisplayName,
  staffAdminProfileNameSelect,
} from "@/lib/staff-display-name";
import { isSuperAdmin } from "@/lib/staff-admin";

const appointmentListInclude = {
  service: true,
  user: { select: { name: true } },
  assignedStaff: { select: staffAdminProfileNameSelect },
} as const;

export type AppointmentStatusFilter = "PENDING" | "CONFIRMED";

export type StaffStatusCounts = {
  pending: number;
  confirmed: number;
};

const UNASSIGNED_KEY = "__unassigned__";

export function getAppointmentStaffFilter(session: SessionUser) {
  const superAdmin = isSuperAdmin(session.role);
  if (!superAdmin && session.staffProfileId) {
    return { assignedStaffId: session.staffProfileId };
  }
  return {};
}

/** Süper admin usta sekmesi / personel parametresi için ek filtre */
export function resolveAppointmentStaffScope(
  session: SessionUser,
  staffProfileId?: string | null
) {
  const base = getAppointmentStaffFilter(session);
  if (!staffProfileId || !isSuperAdmin(session.role)) {
    return base;
  }
  return { assignedStaffId: staffProfileId };
}

export async function countAppointmentsByStatus(
  status: AppointmentStatusFilter,
  staffFilter: ReturnType<typeof getAppointmentStaffFilter>
) {
  return prisma.appointment.count({
    where: { status, ...staffFilter },
  });
}

const STATUS_LIST_MAX = 500;

export async function loadAppointmentsByStatus(
  status: AppointmentStatusFilter,
  staffFilter: ReturnType<typeof getAppointmentStaffFilter>
) {
  return prisma.appointment.findMany({
    where: { status, ...staffFilter },
    include: appointmentListInclude,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: STATUS_LIST_MAX,
  });
}

export async function loadAdminAppointmentStatusCounts(
  session: SessionUser,
  staffProfileId?: string | null
) {
  const staffFilter = resolveAppointmentStaffScope(session, staffProfileId);
  const [pendingCount, confirmedCount] = await Promise.all([
    countAppointmentsByStatus("PENDING", staffFilter),
    countAppointmentsByStatus("CONFIRMED", staffFilter),
  ]);
  return { staffFilter, pendingCount, confirmedCount };
}

/** Süper admin — sekme rozetleri için usta başına sayılar */
export async function loadStaffStatusCountMap(): Promise<
  Record<string, StaffStatusCounts>
> {
  const rows = await prisma.appointment.groupBy({
    by: ["assignedStaffId", "status"],
    where: { status: { in: ["PENDING", "CONFIRMED"] } },
    _count: { _all: true },
  });

  const map: Record<string, StaffStatusCounts> = {};

  for (const row of rows) {
    const key = row.assignedStaffId ?? UNASSIGNED_KEY;
    if (!map[key]) {
      map[key] = { pending: 0, confirmed: 0 };
    }
    if (row.status === "PENDING") {
      map[key].pending = row._count._all;
    } else if (row.status === "CONFIRMED") {
      map[key].confirmed = row._count._all;
    }
  }

  return map;
}

export function globalCountsFromStaffMap(
  map: Record<string, StaffStatusCounts>
): StaffStatusCounts {
  return Object.values(map).reduce(
    (acc, c) => ({
      pending: acc.pending + c.pending,
      confirmed: acc.confirmed + c.confirmed,
    }),
    { pending: 0, confirmed: 0 }
  );
}

export function countsForStaffProfile(
  map: Record<string, StaffStatusCounts>,
  staffProfileId: string | null
): StaffStatusCounts {
  if (!staffProfileId) {
    return globalCountsFromStaffMap(map);
  }
  return map[staffProfileId] ?? { pending: 0, confirmed: 0 };
}

export async function resolveStaffScopeBySlug(
  session: SessionUser,
  personelSlug?: string | null
) {
  if (!personelSlug?.trim()) {
    return {
      staffProfileId: null as string | null,
      staffFilter: getAppointmentStaffFilter(session),
      staffDisplayName: null as string | null,
      staffSlug: null as string | null,
    };
  }

  if (!isSuperAdmin(session.role)) {
    return {
      staffProfileId: session.staffProfileId ?? null,
      staffFilter: getAppointmentStaffFilter(session),
      staffDisplayName: null,
      staffSlug: null,
    };
  }

  const profile = await prisma.staffAdminProfile.findUnique({
    where: { slug: personelSlug.trim() },
    select: staffAdminProfileNameSelect,
  });

  if (!profile) {
    return {
      staffProfileId: null,
      staffFilter: getAppointmentStaffFilter(session),
      staffDisplayName: null,
      staffSlug: null,
    };
  }

  return {
    staffProfileId: profile.id,
    staffFilter: { assignedStaffId: profile.id },
    staffDisplayName: getStaffDisplayName(profile),
    staffSlug: profile.slug,
  };
}
