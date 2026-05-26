import { getSuperAdminPanelName } from "@/lib/staff-panel";

/** Randevu ve panelde usta adı — öncelik: kullanıcı ad soyad, yoksa panel etiketi */
export type StaffNameSource = {
  label: string;
  user?: { name: string } | null;
};

function isLotusAdminAlias(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return (
    lower === "lotus admin" ||
    lower === "lotus administrator" ||
    lower === "lotus yönetici"
  );
}

export function getStaffDisplayName(
  staff: StaffNameSource | null | undefined
): string {
  if (!staff) return "";
  const fullName = staff.user?.name?.trim();
  if (fullName && !isLotusAdminAlias(fullName)) return fullName;
  const label = staff.label.trim();
  if (isLotusAdminAlias(label)) return getSuperAdminPanelName();
  if (fullName) return fullName;
  return label;
}
export const staffAdminProfileNameSelect = {
  id: true,
  slug: true,
  label: true,
  color: true,
  userId: true,
  user: { select: { name: true } },
} as const;

export const staffAdminProfileNameSelectFull = {
  ...staffAdminProfileNameSelect,
  sortOrder: true,
} as const;

export function adminAppointmentStatusHref(
  kind: "pending" | "confirmed",
  staffSlug?: string | null
): string {
  const base =
    kind === "pending"
      ? "/admin/randevular/onay-bekleyen"
      : "/admin/randevular/onayli";
  if (!staffSlug) return base;
  return `${base}?personel=${encodeURIComponent(staffSlug)}`;
}
