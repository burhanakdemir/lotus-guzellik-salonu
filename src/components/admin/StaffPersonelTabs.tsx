"use client";

export type StaffProfileTab = {
  id: string;
  slug: string;
  label: string;
  color: string | null;
};

export function StaffPersonelTabs({
  profiles,
  activeStaffId,
  onSelect,
  showAllTab = true,
}: {
  profiles: StaffProfileTab[];
  activeStaffId: string | null;
  onSelect: (staffId: string | null) => void;
  showAllTab?: boolean;
}) {
  if (profiles.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-gray-200 pb-2"
      role="tablist"
      aria-label="Ustalar"
    >
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Ustalar
      </span>
      {showAllTab && (
        <button
          type="button"
          role="tab"
          aria-selected={activeStaffId === null}
          className={`rounded px-2.5 py-1 text-[11px] font-medium ${
            activeStaffId === null
              ? "bg-lotus-700 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-lotus-50"
          }`}
          onClick={() => onSelect(null)}
        >
          Tümü
        </button>
      )}
      {profiles.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          aria-selected={activeStaffId === p.id}
          className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium ${
            activeStaffId === p.id
              ? "bg-lotus-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-lotus-50"
          }`}
          onClick={() => onSelect(p.id)}
        >
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: p.color || "#d97b9a" }}
            aria-hidden
          />
          {p.label}
        </button>
      ))}
    </div>
  );
}
