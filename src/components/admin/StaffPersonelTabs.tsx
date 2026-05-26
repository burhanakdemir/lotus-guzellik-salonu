"use client";

export type StaffProfileTab = {
  id: string;
  slug: string;
  label: string;
  /** Ad soyad (panelde görünen) */
  displayName: string;
  color: string | null;
};

export function StaffPersonelTabs({
  profiles,
  activeStaffId,
  onSelect,
  showAllTab = true,
  variant = "default",
  pendingCountFor,
}: {
  profiles: StaffProfileTab[];
  activeStaffId: string | null;
  onSelect: (staffId: string | null) => void;
  showAllTab?: boolean;
  variant?: "default" | "admin";
  /** Sekme üzerinde onay bekleyen sayısı */
  pendingCountFor?: (staffId: string | null) => number;
}) {
  if (profiles.length === 0) return null;

  const isAdmin = variant === "admin";

  return (
    <div
      className={isAdmin ? "admin-staff-tabs" : "flex flex-wrap items-center gap-1 border-b border-gray-200 pb-2"}
      role="tablist"
      aria-label="Ustalar"
    >
      <span className={isAdmin ? "admin-staff-tabs__label" : "mr-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500"}>
        Ustalar
      </span>
      {showAllTab && (
        <button
          type="button"
          role="tab"
          aria-selected={activeStaffId === null}
          className={
            isAdmin
              ? activeStaffId === null
                ? "admin-staff-tabs__btn admin-staff-tabs__btn--active"
                : "admin-staff-tabs__btn"
              : `rounded px-2.5 py-1 text-[11px] font-medium ${
                  activeStaffId === null
                    ? "bg-lotus-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-lotus-50"
                }`
          }
          onClick={() => onSelect(null)}
        >
          Tümü
          {pendingCountFor && pendingCountFor(null) > 0 && (
            <span className={isAdmin ? "admin-staff-tabs__count" : "ml-1 rounded-full bg-amber-500 px-1 text-[9px] text-white"}>
              {pendingCountFor(null)}
            </span>
          )}
        </button>
      )}
      {profiles.map((p) => {
        const active = activeStaffId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={
              isAdmin
                ? active
                  ? "admin-staff-tabs__btn admin-staff-tabs__btn--active"
                  : "admin-staff-tabs__btn"
                : `inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium ${
                    active
                      ? "bg-lotus-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-lotus-50"
                  }`
            }
            onClick={() => onSelect(p.id)}
          >
            <span
              className={isAdmin ? "admin-staff-tabs__dot" : "inline-block h-2 w-2 shrink-0 rounded-full"}
              style={{ backgroundColor: p.color || "#d97b9a" }}
              aria-hidden
            />
            {p.displayName}
            {pendingCountFor && pendingCountFor(p.id) > 0 && (
              <span className={isAdmin ? "admin-staff-tabs__count" : "ml-1 rounded-full bg-amber-500 px-1 text-[9px] text-white"}>
                {pendingCountFor(p.id)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
