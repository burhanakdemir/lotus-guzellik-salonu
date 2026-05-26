"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { StaffProfileTab } from "@/components/admin/StaffPersonelTabs";

export function StaffContentTabs({
  profiles,
  basePath,
  showAllTab = true,
}: {
  profiles: StaffProfileTab[];
  basePath: "/admin/galeri" | "/admin/yorumlar";
  showAllTab?: boolean;
}) {
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("personel");

  function hrefFor(slug: string | null) {
    if (!slug) return basePath;
    const params = new URLSearchParams(searchParams.toString());
    params.set("personel", slug);
    const q = params.toString();
    return `${basePath}?${q}`;
  }

  if (profiles.length === 0) return null;

  return (
    <div className="admin-staff-tabs" role="tablist" aria-label="Ustalar">
      <span className="admin-staff-tabs__label">Ustalar</span>
      {showAllTab && (
        <Link
          href={hrefFor(null)}
          role="tab"
          aria-selected={!activeSlug}
          className={
            !activeSlug
              ? "admin-staff-tabs__btn admin-staff-tabs__btn--active"
              : "admin-staff-tabs__btn"
          }
        >
          Tümü
        </Link>
      )}
      {profiles.map((p) => (
        <Link
          key={p.id}
          href={hrefFor(p.slug)}
          role="tab"
          aria-selected={activeSlug === p.slug}
          className={
            activeSlug === p.slug
              ? "admin-staff-tabs__btn admin-staff-tabs__btn--active"
              : "admin-staff-tabs__btn"
          }
          style={
            p.color && activeSlug === p.slug
              ? { borderColor: p.color }
              : undefined
          }
        >
          {p.displayName}
        </Link>
      ))}
    </div>
  );
}
