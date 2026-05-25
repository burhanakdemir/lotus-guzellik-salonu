import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { MemberNotificationBell } from "@/components/MemberNotificationBell";
import { LogoutButton } from "@/components/LogoutButton";

const headerBtn =
  "btn-gold !bg-gradient-to-r !from-gold-dark !via-gold !to-lotus-center !py-2.5 !px-6 !text-xs !font-bold !text-lotus-900 !shadow-lg !shadow-gold/30";

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-lotus-200/70 bg-white/85 shadow-sm shadow-lotus-600/5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/logo/lotus-sade.png"
            alt="Lotus Kuaför & Güzellik Salonu"
            width={52}
            height={52}
            className="h-12 w-auto shrink-0 object-contain transition duration-300 group-hover:opacity-90"
            priority
          />
          <div className="header-brand" aria-label="Lotus Kuaför ve Güzellik Salonu">
            <span className="header-brand__line">Lotus Kuaför</span>
            <span className="header-brand__amp">&amp;</span>
            <span className="header-brand__line header-brand__line--sub">
              Güzellik Salonu
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-medium text-lotus-800/80 md:flex lg:gap-5">
          <Link href="/" className="transition hover:text-lotus-600">
            Ana Sayfa
          </Link>
          <Link href="/hizmetler" className="transition hover:text-lotus-600">
            Hizmetler
          </Link>
          <Link href="/hakkimizda" className="transition hover:text-lotus-600">
            Hakkımızda
          </Link>
          <Link href="/galeri" className="transition hover:text-lotus-600">
            Galeri
          </Link>
          <Link href="/yorumlar" className="transition hover:text-lotus-600">
            Yorumlar
          </Link>
          <Link href="/randevu" className={headerBtn}>
            Randevu Al
          </Link>
          {session ? (
            <>
              {session.role !== "ADMIN" && session.role !== "STAFF_ADMIN" && (
                <Link href="/admin/giris" className={headerBtn}>
                  Usta Girişi
                </Link>
              )}
              <LogoutButton className={headerBtn}>Üye Çıkış</LogoutButton>
            </>
          ) : (
            <>
              <Link href="/uye-ol" className={headerBtn}>
                Üye Ol
              </Link>
              <Link href="/giris" className={headerBtn}>
                Üye Girişi
              </Link>
              <Link href="/admin/giris" className={headerBtn}>
                Usta Girişi
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session?.role === "MEMBER" && <MemberNotificationBell />}
          {session && (
            <>
              {session.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden text-xs font-medium uppercase tracking-wider text-lotus-600 hover:text-lotus-800 md:inline"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/hesabim"
                className="rounded-full bg-lotus-100 px-4 py-2 text-sm font-medium text-lotus-800 transition hover:bg-lotus-200"
              >
                {session.name.split(" ")[0]}
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="flex justify-center gap-6 border-t border-lotus-100 px-4 py-2.5 text-xs font-medium text-lotus-700/70 md:hidden">
        <Link href="/hizmetler" className="hover:text-lotus-600">Hizmetler</Link>
        <Link href="/randevu" className="font-semibold text-lotus-600">Randevu</Link>
        <Link href="/hakkimizda" className="hover:text-lotus-600">Hakkımızda</Link>
        <Link href="/galeri" className="hover:text-lotus-600">Galeri</Link>
        <Link href="/yorumlar" className="hover:text-lotus-600">Yorumlar</Link>
        <Link href="/admin/giris" className="font-semibold text-lotus-600">
          Usta Girişi
        </Link>
      </nav>
    </header>
  );
}
