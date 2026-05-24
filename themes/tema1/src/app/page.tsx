import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ServiceCard } from "@/components/ServiceCard";
import { WeeklyPromotions } from "@/components/WeeklyPromotions";

export default async function HomePage() {
  const now = new Date();
  const [settings, featured, promotions, serviceCount] = await Promise.all([
    prisma.salonSettings.findUnique({ where: { id: "default" } }),
    prisma.service.findMany({
      where: { isActive: true, isFeatured: true, deletedAt: null },
      take: 6,
      orderBy: { name: "asc" },
    }),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { services: { include: { service: true } } },
      orderBy: { startDate: "desc" },
      take: 3,
    }),
    prisma.service.count({ where: { isActive: true, deletedAt: null } }),
  ]);

  return (
    <div>
      {/* Hero — kompakt, lotus gradient */}
      <section className="relative overflow-hidden">
        <Image
          src="/hero-bg.svg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        <div className="hero-pattern absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-lotus-700 via-lotus-800 to-lotus-900" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-start gap-6 px-4 pt-4 pb-8 md:pt-5 md:pb-10 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pt-6 lg:pb-12">
          <div>
            <h1 className="font-display text-3xl font-light leading-tight text-white md:text-4xl lg:text-5xl">
              {settings?.heroTitle}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-snug text-lotus-100/95 md:text-lg">
              {settings?.heroSubtitle}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/randevu" className="btn-gold">
                Randevu Al
              </Link>
              <Link href="/uye-ol" className="btn-gold">
                Üye Ol
              </Link>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-max max-w-full rounded-lg border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
              <h2 className="font-display whitespace-nowrap text-lg text-lotus-center">Neden LOTUS?</h2>
              <ul className="mt-2 space-y-1.5">
                {[
                  "Profesyonel ve deneyimli güzellik ekibi",
                  "Hijyenik, modern ve konforlu salon ortamı",
                  "Online randevu — üye olmadan da kolayca",
                  "Üyelere özel indirim ve kampanyalar",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 whitespace-nowrap text-sm text-lotus-50 md:text-base"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lotus-center text-[9px] font-bold text-lotus-900">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <WeeklyPromotions promotions={promotions} />

      {/* Hizmetler */}
      <section
        className={
          promotions.length > 0 ? "relative z-10 -mt-5 md:-mt-6" : "relative z-10"
        }
      >
        <div
          className={`relative overflow-hidden px-4 pb-3 md:pb-4 ${
            promotions.length > 0 ? "pt-5 md:pt-6" : "-mt-8 pt-9 md:pt-11"
          }`}
        >
          <div className="hero-pattern absolute inset-0 opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-lotus-700 via-lotus-800 to-lotus-900" />
          <div className="relative z-10 mx-auto text-center">
            <h2 className="font-display text-3xl font-bold tracking-wide text-white md:text-4xl">
              Öne Çıkan Hizmetler
            </h2>
          </div>
        </div>

        <div className="mx-auto max-w-7xl bg-cream px-4 py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((s) => (
              <ServiceCard key={s.id} {...s} compact />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/hizmetler" className="btn-secondary">
              Tüm {serviceCount} Hizmeti Görüntüle
            </Link>
          </div>
        </div>
      </section>

      {/* CTA — ince şerit */}
      <section className="relative overflow-hidden bg-gradient-to-br from-lotus-700 via-lotus-800 to-lotus-900 px-4 py-3 text-center md:py-4">
        <div className="relative mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 md:gap-4">
          <h2 className="font-display text-lg text-white md:text-xl">Sıra sizde</h2>
          <span className="hidden text-lotus-300 md:inline">·</span>
          <p className="text-sm text-lotus-200">Telefon numaranızla hemen randevu</p>
          <Link href="/randevu" className="btn-gold !py-2 !px-5 !text-xs">
            Online Randevu
          </Link>
        </div>
      </section>
    </div>
  );
}
