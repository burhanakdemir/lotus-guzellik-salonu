"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";

type Props = {
  session: SessionUser | null;
};

type NavItem = {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: ({ active }: { active: boolean }) => React.ReactElement;
  accent?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Ana Sayfa", match: (p) => p === "/", icon: HomeIcon },
  { href: "/hizmetler", label: "Hizmetler", match: (p) => p.startsWith("/hizmetler"), icon: ServicesIcon },
  { href: "/randevu", label: "Randevu", match: (p) => p.startsWith("/randevu"), icon: CalendarIcon, accent: true },
  { href: "/galeri", label: "Galeri", match: (p) => p.startsWith("/galeri"), icon: GalleryIcon },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
      {active ? (
        <path d="M12 3l9 8v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V11l9-8z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5L12 4l8 7.5M6 10.5V20h4v-5h4v5h4v-9.5" />
      )}
    </svg>
  );
}

function ServicesIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75}>
      <path strokeLinecap="round" d="M6 6h12M6 12h12M6 18h8" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
      {active ? (
        <path d="M7 2v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zm12 8H5v10h14V10z" />
      ) : (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" />
        </>
      )}
    </svg>
  );
}

function GalleryIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="11" r="1.5" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.5-4 3 3 5-5 3.5 4" />
    </svg>
  );
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
      {active ? (
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zM5 21a7 7 0 0114 0" />
      )}
    </svg>
  );
}

export function MobileBottomNav({ session }: Props) {
  const pathname = usePathname();
  const accountHref = session ? "/hesabim" : "/giris";
  const accountActive =
    pathname.startsWith("/hesabim") ||
    pathname.startsWith("/giris") ||
    pathname.startsWith("/uye-ol");

  return (
    <nav
      className="site-mobile-only mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-lotus-200/80 bg-white/95 backdrop-blur-xl"
      aria-label="Ana menü"
    >
      <ul className="mobile-bottom-nav__list mx-auto flex max-w-lg items-end justify-around px-1 pt-1">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`mobile-bottom-nav__item flex flex-col items-center gap-0.5 px-1 pb-1 pt-1.5 ${
                  active ? "mobile-bottom-nav__item--active" : ""
                } ${item.accent ? "mobile-bottom-nav__item--accent" : ""}`}
              >
                <span className={item.accent ? "mobile-bottom-nav__icon-ring" : ""}>
                  <Icon active={active} />
                </span>
                <span className="mobile-bottom-nav__label">{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <Link
            href={accountHref}
            className={`mobile-bottom-nav__item flex flex-col items-center gap-0.5 px-1 pb-1 pt-1.5 ${
              accountActive ? "mobile-bottom-nav__item--active" : ""
            }`}
          >
            <AccountIcon active={accountActive} />
            <span className="mobile-bottom-nav__label">
              {session ? "Hesabım" : "Giriş"}
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
