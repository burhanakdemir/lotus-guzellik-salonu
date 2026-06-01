import { getViewRange, parseDateKey } from "@/lib/calendar-dates";
import {
  getAppointmentMemberDisplayName,
  isLotusAdminAlias,
} from "@/lib/admin-appointment-line";
import { getAppointmentStaffFilter } from "@/lib/admin-appointment-status";
import type { SessionUser } from "@/lib/auth";
import { memberPhoneOrConditions } from "@/lib/member-account";
import { staffAdminProfileNameSelect } from "@/lib/staff-display-name";
import { prisma } from "@/lib/prisma";
import { todayString } from "@/lib/timezone";
import { normalizePhone } from "@/lib/utils";

export const appointmentWithMemberInclude = {
  service: true,
  user: { select: { name: true } },
  assignedStaff: { select: staffAdminProfileNameSelect },
} as const;

export type AdminAppointmentRecord = {
  id: string;
  name: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceId: string;
  assignedStaffId: string | null;
  user: { name: string } | null;
  assignedStaff: {
    id: string;
    slug: string;
    label: string;
    color: string | null;
    user?: { name: string } | null;
  } | null;
  service: { name: string };
};

async function buildMemberDisplayNameByPhone(
  appointments: AdminAppointmentRecord[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const a of appointments) {
    const phoneKey = normalizePhone(a.phone);
    if (phoneKey.length !== 10) continue;
    const fromUser = a.user?.name?.trim();
    if (fromUser && !isLotusAdminAlias(fromUser)) {
      map.set(phoneKey, fromUser);
    }
  }

  const phonesNeedingLookup = new Set<string>();
  for (const a of appointments) {
    const phoneKey = normalizePhone(a.phone);
    if (phoneKey.length !== 10) continue;
    if (map.has(phoneKey)) continue;

    const fromBooking = a.name.trim();
    if (fromBooking && !isLotusAdminAlias(fromBooking)) {
      map.set(phoneKey, fromBooking);
      continue;
    }

    phonesNeedingLookup.add(phoneKey);
  }

  if (phonesNeedingLookup.size === 0) return map;

  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      isActive: true,
      OR: [...phonesNeedingLookup].flatMap((p) => memberPhoneOrConditions(p)),
    },
    select: { name: true, phone: true },
  });

  for (const m of members) {
    const key = normalizePhone(m.phone);
    const name = m.name?.trim();
    if (name && !isLotusAdminAlias(name)) {
      map.set(key, name);
    }
  }

  return map;
}

function toMappedAppointment(
  a: AdminAppointmentRecord,
  memberNames: Map<string, string>
) {
  const phoneKey = normalizePhone(a.phone);
  const preset = memberNames.get(phoneKey);
  return {
    id: a.id,
    name: a.name,
    user: a.user,
    memberDisplayName: getAppointmentMemberDisplayName({
      name: a.name,
      user: a.user,
      memberDisplayName: preset,
    }),
    phone: a.phone,
    date: a.date,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    assignedStaffId: a.assignedStaffId,
    assignedStaff: a.assignedStaff,
    service: { id: a.serviceId, name: a.service.name },
  };
}

export async function mapAdminAppointments(
  appointments: AdminAppointmentRecord[]
) {
  const memberNames = await buildMemberDisplayNameByPhone(appointments);
  return appointments.map((a) => toMappedAppointment(a, memberNames));
}

export async function loadAdminAppointmentsData(session: SessionUser) {
  const today = todayString();
  const monthRange = getViewRange("month", parseDateKey(today));
  const staffFilter = getAppointmentStaffFilter(session);

  const [appointments, services] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        date: { gte: monthRange.from, lte: monthRange.to },
        ...staffFilter,
      },
      include: appointmentWithMemberInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, durationMinutes: true },
    }),
  ]);

  return {
    today,
    monthRange,
    appointments: appointments as AdminAppointmentRecord[],
    services,
  };
}
