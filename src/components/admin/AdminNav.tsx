"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StaffNotificationBell } from "@/components/admin/StaffNotificationBell";

const superLinks = [
  { href: "/admin", label: "Özet" },
  { href: "/admin/randevular", label: "Randevu" },
  { href: "/admin/hizmetler", label: "Hizmet" },
  { href: "/admin/kampanyalar", label: "Kampanya" },
  { href: "/admin/galeri", label: "Galeri" },
  { href: "/admin/yorumlar", label: "Yorum" },
  { href: "/admin/bildirimler", label: "Bildirim" },
  { href: "/admin/uyeler", label: "Üye" },
  { href: "/admin/ayarlar", label: "Ayar" },
];

const staffLinks = [
  { href: "/admin", label: "Özet" },
  { href: "/admin/randevular", label: "Randevu" },
];

type AdminNavProps = {
  session: {
    role: "ADMIN" | "STAFF_ADMIN";
    isMultiAdmin: boolean;
    showNotifications?: boolean;
    displayName: string;
  } | null;
};

export function AdminNav({ session }: AdminNavProps) {
  const pathname = usePathname();
  if (pathname === "/admin/giris") return null;

  const isStaff =
    session?.isMultiAdmin && session.role === "STAFF_ADMIN";
  const links = isStaff ? staffLinks : superLinks;

  return (
    <nav className="admin-nav" aria-label="Admin menü">
      <span className="admin-nav__brand" title={session?.displayName}>
        {session?.displayName ?? ""}
      </span>
      <div className="admin-nav__links">
        {links.map((l) => {
          const active =
            pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={
                active
                  ? "admin-nav__btn admin-nav__btn--active"
                  : "admin-nav__btn"
              }
            >
              {l.label}
            </Link>
          );
        })}
      </div>
      <div className="admin-nav__actions">
        {session?.showNotifications && <StaffNotificationBell />}
        <Link href="/" className="admin-nav__btn">
          Ana Sayfa
        </Link>
      </div>
    </nav>
  );
}
