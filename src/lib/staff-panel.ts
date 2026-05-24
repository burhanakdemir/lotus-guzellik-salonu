/** Randevu paneli ve online randevuda süper adminin görünen adı */
export function getSuperAdminPanelName(): string {
  return (
    process.env.SUPER_ADMIN_PANEL_NAME?.trim() ||
    process.env.ADMIN_NAME?.trim() ||
    "Neşe Akdemir"
  );
}

export type StaffProfileSortable = {
  label: string;
  sortOrder: number;
};

/** Süper admin (Neşe Akdemir) her zaman ilk sekme */
export function orderStaffProfilesForPanel<T extends StaffProfileSortable>(
  profiles: T[]
): T[] {
  const primary = getSuperAdminPanelName().toLowerCase();
  return [...profiles].sort((a, b) => {
    const aPrimary = a.label.trim().toLowerCase() === primary;
    const bPrimary = b.label.trim().toLowerCase() === primary;
    if (aPrimary !== bPrimary) return aPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "tr");
  });
}
