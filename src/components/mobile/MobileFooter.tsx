import Link from "next/link";
import { getSalonSettingsSafe } from "@/lib/db-safe";

export async function MobileFooter() {
  const settings = await getSalonSettingsSafe();
  const phone = settings?.phone?.replace(/\s/g, "") ?? "";

  return (
    <footer className="site-mobile-only mobile-footer border-t border-lotus-200/60 bg-lotus-800 text-lotus-100">
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="text-center">
          <p className="font-display text-xl text-white">LOTUS</p>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="mt-2 inline-block text-lg font-semibold text-lotus-center"
            >
              {settings?.phone}
            </a>
          )}
          <p className="mt-2 text-xs leading-relaxed text-lotus-200/90">
            {settings?.address}
          </p>
        </div>
        <nav
          className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium"
          aria-label="Ek sayfalar"
        >
          <Link href="/hakkimizda" className="text-lotus-200 hover:text-white">
            Hakkımızda
          </Link>
          <Link href="/yorumlar" className="text-lotus-200 hover:text-white">
            Yorumlar
          </Link>
          <Link href="/randevu" className="text-lotus-center hover:text-white">
            Randevu
          </Link>
        </nav>
        <p className="mt-4 text-center text-[10px] text-lotus-300/80">
          lotuskuafor.com · Antalya Kepez
        </p>
      </div>
    </footer>
  );
}
