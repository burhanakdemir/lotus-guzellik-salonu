import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import { formatPhoneDisplay } from "@/lib/phone";
import { getSuperAdminPanelName } from "@/lib/staff-panel";

type AppointmentLineSource = Pick<
  CalendarAppointment,
  | "name"
  | "phone"
  | "date"
  | "startTime"
  | "endTime"
  | "service"
  | "assignedStaff"
  | "assignedStaffId"
> & {
  user?: { name: string } | null;
};

export function isLotusAdminAlias(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return (
    lower === "lotus admin" ||
    lower === "lotus administrator" ||
    lower === "lotus yönetici"
  );
}

/** Üst satır — “Lotus Admin” vb. → Neşe AKDEMİR */
export function getAppointmentHeadlineName(
  apt: Pick<AppointmentLineSource, "name">
): string {
  const trimmed = apt.name.trim();
  if (isLotusAdminAlias(trimmed)) {
    return getSuperAdminPanelName();
  }
  return trimmed;
}

type MemberNameSource = Pick<AppointmentLineSource, "name" | "user"> & {
  memberDisplayName?: string | null;
};

/** Randevu alan üye / misafir ad soyad (yönetici takma adı değil) */
export function getAppointmentMemberDisplayName(apt: MemberNameSource): string {
  const preset = apt.memberDisplayName?.trim();
  if (preset) return preset;

  const fromUser = apt.user?.name?.trim();
  if (fromUser && !isLotusAdminAlias(fromUser)) {
    return fromUser;
  }
  const fromBooking = apt.name.trim();
  if (fromBooking && !isLotusAdminAlias(fromBooking)) {
    return fromBooking;
  }
  return fromUser || fromBooking;
}

/** Onaylı liste — öncelik sunucuda çözümlenmiş üye adı */
export function getAppointmentBookerName(apt: MemberNameSource): string {
  return apt.memberDisplayName?.trim() || getAppointmentMemberDisplayName(apt);
}

export type AdminAppointmentDisplay = {
  headline: string;
  detailsRow: string;
};

export function getAdminAppointmentDisplay(
  apt: AppointmentLineSource,
  _options?: { showStaff?: boolean }
): AdminAppointmentDisplay {
  const memberName = getAppointmentMemberDisplayName(apt);
  const phone = formatPhoneDisplay(apt.phone);
  const when = `${apt.date} · ${apt.startTime}–${apt.endTime}`;
  const service = apt.service.name;

  const headline = getAppointmentHeadlineName(apt);
  const rowParts = [memberName, phone, when, service];

  return {
    headline,
    detailsRow: rowParts.join(", "),
  };
}

export function formatAdminAppointmentLine(
  apt: AppointmentLineSource,
  options?: { showStaff?: boolean }
): string {
  const d = getAdminAppointmentDisplay(apt, options);
  if (d.headline === d.detailsRow.split(",")[0]?.trim()) {
    return d.detailsRow;
  }
  return `${d.headline}\n${d.detailsRow}`;
}
