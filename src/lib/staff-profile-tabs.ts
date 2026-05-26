import { getStaffDisplayName } from "@/lib/staff-display-name";
import type { StaffProfileTab } from "@/components/admin/StaffPersonelTabs";

type StaffRow = {
  id: string;
  slug: string;
  label: string;
  color: string | null;
  user?: { name: string } | null;
};

export function toStaffProfileTabs(profiles: StaffRow[]): StaffProfileTab[] {
  return profiles.map((p) => ({
    id: p.id,
    slug: p.slug,
    label: p.label,
    displayName: getStaffDisplayName(p),
    color: p.color,
  }));
}
