import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LotusLogo } from "@/components/LotusLogo";
import { LogoutButton } from "@/components/LogoutButton";

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-lotus-200/70 bg-white/85 shadow-sm shadow-lotus-600/5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lotus-blush via-lotus-100 to-lotus-200 shadow-md ring-2 ring-lotus-300/50 transition duration-300 group-hover:ring-lotus-center group-hover:shadow-lotus-400/30">
            <LotusLogo size={40} variant="icon" id="header-lotus" />
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-xl font-semibold tracking-wide text-lotus-900">
              LOTUS
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-lotus-600">
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
          <Link href="/randevu" className="btn-gold !py-2.5 !px-6 !text-xs">
            Randevu Al
          </Link>
          {session ? (
            <LogoutButton className="btn-gold !py-2.5 !px-6 !text-xs">
              Üye Çıkış
            </LogoutButton>
          ) : (
            <>
              <Link href="/uye-ol" className="btn-gold !py-2.5 !px-6 !text-xs">
                Üye Ol
              </Link>
              <Link href="/giris" className="btn-gold !py-2.5 !px-6 !text-xs">
                Üye Girişi
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
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
      </nav>
    </header>
  );
}
