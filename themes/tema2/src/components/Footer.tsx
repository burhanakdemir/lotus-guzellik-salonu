import { LotusLogo } from "@/components/LotusLogo";
import { getSalonSettingsSafe } from "@/lib/db-safe";

export async function Footer() {
  const settings = await getSalonSettingsSafe();
  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-br from-lotus-700 via-lotus-800 to-lotus-900 text-lotus-100">
      <div className="hero-pattern absolute inset-0 opacity-30" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-white/10 p-1 ring-1 ring-lotus-300/25">
            <LotusLogo size={30} id="footer-lotus" />
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="font-display text-lg leading-none text-white">LOTUS</p>
              <a
                href={`tel:${settings?.phone?.replace(/\s/g, "")}`}
                className="font-display text-xl leading-none text-lotus-center transition hover:text-white md:text-2xl"
              >
                {settings?.phone}
              </a>
            </div>
            <p className="text-[10px] tracking-[0.2em] text-lotus-center">ANTALYA</p>
            <p className="mt-1 max-w-xs text-[11px] leading-snug text-lotus-200/90">
              {settings?.salonName}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="max-w-sm text-[11px] leading-snug text-lotus-200">
            {settings?.address}
          </p>
        </div>
      </div>
    </footer>
  );
}
