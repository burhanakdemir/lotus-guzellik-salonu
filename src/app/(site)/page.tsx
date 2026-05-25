import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSalonSettingsSafe, safeDbQuery } from "@/lib/db-safe";
import { getSalonDisplaySettings } from "@/lib/salon-display";
import { ServiceCard } from "@/components/ServiceCard";
import { HeroShowcaseGrid } from "@/components/HeroShowcaseGrid";
import { WeeklyPromotions } from "@/components/WeeklyPromotions";
import { servicesCatalog } from "../../../prisma/services-catalog";

export default async function HomePage() {
  const now = new Date();
  const [settings, display, featured, promotions, serviceCount] = await Promise.all([
    getSalonSettingsSafe(),
    getSalonDisplaySettings(),
    safeDbQuery(
      () =>
        prisma.service.findMany({
          where: { isActive: true, isFeatured: true, deletedAt: null },
          take: 6,
          orderBy: { name: "asc" },
        }),
      []
    ),
    safeDbQuery(
      () =>
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
      []
    ),
    safeDbQuery(
      () => prisma.service.count({ where: { isActive: true, deletedAt: null } }),
      servicesCatalog.length
    ),
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

        <div className="hero-inner relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
          <div className="hero-head">
            <h1 className="hero-head__title font-display text-3xl font-light leading-tight text-white md:text-4xl lg:text-5xl">
              {settings?.heroTitle}
            </h1>

            <div className="hero-highlights">
              <h2 className="hero-highlights__title">Neden LOTUS?</h2>
              <ul className="hero-highlights__list">
                {[
                  "Profesyonel ve deneyimli güzellik ekibi",
                  "Hijyenik, modern ve konforlu salon ortamı",
                  "Online randevu — üye olmadan da kolayca",
                  "Üyelere özel indirim ve kampanyalar",
                ].map((item) => (
                  <li key={item} className="hero-highlights__item">
                    <span className="hero-highlights__icon" aria-hidden>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="hero-head__subtitle max-w-xl text-base leading-snug text-lotus-100/95 md:text-lg">
              {settings?.heroSubtitle}
            </p>
          </div>

          <HeroShowcaseGrid settings={settings} />
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
              <ServiceCard
                key={s.id}
                {...s}
                compact
                showPrice={display.showPrice}
                showDuration={display.showDuration}
              />
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
