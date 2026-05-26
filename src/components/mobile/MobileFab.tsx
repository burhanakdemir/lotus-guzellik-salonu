"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileFab() {
  const pathname = usePathname();
  if (pathname.startsWith("/randevu")) return null;

  return (
    <Link href="/randevu" className="site-mobile-only mobile-fab" aria-label="Randevu al">
      Randevu Al
    </Link>
  );
}
