import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { catalogServicesFallback, safeDbQuery } from "@/lib/db-safe";
import {
  categorySectionId,
  groupServicesByCategory,
} from "@/lib/group-services-by-category";
import { CategoryImage } from "@/components/CategoryImage";
import { ServiceCard } from "@/components/ServiceCard";
import { MobileServicesExplorer } from "@/components/mobile/MobileServicesExplorer";
import { getServiceCategoryLabel } from "@/lib/service-categories";
import { getSalonDisplaySettings } from "@/lib/salon-display";
import { shouldShowServicePrice } from "@/lib/service-price-display";

export default async function HizmetlerPage() {
  const display = await getSalonDisplaySettings();
  const services = await safeDbQuery(
    () =>
      prisma.service.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      }),
    catalogServicesFallback()
  );

  const { grouped, sortedCategories } = groupServicesByCategory(services);

  return (
    <div>
      <MobileServicesExplorer
        services={services}
        showPrice={display.showPrice}
        showDuration={display.showDuration}
      />

      <div className="site-desktop-only">
        <section className="services-page-hero relative overflow-hidden bg-gradient-to-br from-lotus-800 via-lotus-700 to-lotus-600 px-4 text-center text-white">
          <div className="hero-pattern absolute inset-0" />
          <div className="relative mx-auto max-w-3xl">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white drop-shadow-sm md:text-4xl md:font-bold">
              Hizmetlerimiz
            </h1>
            <p className="mt-1 text-xs text-rose-100/90 md:text-sm">
              {sortedCategories.length} kategori · {services.length} hizmet
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-5">
          {sortedCategories.length > 0 && (
            <nav
              className="services-category-nav sticky top-0 z-20 mb-5 border-b border-rose-100 bg-cream/95 py-1.5 backdrop-blur-sm"
              aria-label="Hizmet kategorileri"
            >
              <ul className="services-category-nav__grid">
                {sortedCategories.map((cat) => (
                  <li key={cat}>
                    <a
                      href={`#${categorySectionId(cat)}`}
                      className="services-category-nav__item"
                    >
                      <span className="services-category-nav__label">
                        {getServiceCategoryLabel(cat)}
                      </span>
                      <span className="services-category-nav__count">
                        {grouped[cat].length}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {sortedCategories.map((cat, idx) => {
            const items = grouped[cat];
            return (
              <section
                key={cat}
                id={categorySectionId(cat)}
                className={`scroll-mt-24 ${idx > 0 ? "mt-20" : ""}`}
              >
                <div className="relative mb-8 overflow-hidden rounded-2xl">
                  <div className="relative h-40 w-full md:h-48">
                    <CategoryImage
                      category={cat}
                      alt={getServiceCategoryLabel(cat)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1280px) 100vw, 1280px"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-lotus-900/80 via-lotus-800/55 to-lotus-700/30" />
                  </div>
                  <div className="absolute inset-0 flex items-end justify-between p-5 md:p-6">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-lotus-center">
                        Kategori {idx + 1} / {sortedCategories.length}
                      </p>
                      <h2 className="font-display text-2xl text-white md:text-3xl">
                        {getServiceCategoryLabel(cat)}
                      </h2>
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-sm text-white backdrop-blur-sm">
                      {items.length} hizmet
                    </span>
                  </div>
                </div>
                <div className="services-list-defer grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => (
                    <ServiceCard
                      key={s.id}
                      {...s}
                      showPrice={shouldShowServicePrice(
                        display.showPrice,
                        s,
                        "public"
                      )}
                      showDuration={display.showDuration}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <div className="mt-20 rounded-3xl bg-gradient-to-r from-lotus-700 to-lotus-900 p-10 text-center text-white">
            <h3 className="font-display text-3xl">Karar veremediniz mi?</h3>
            <p className="mt-3 text-rose-200">Size en uygun hizmeti birlikte seçelim.</p>
            <Link href="/randevu" className="btn-gold mt-8">
              Randevu Al
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
