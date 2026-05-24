import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { catalogServicesFallback, safeDbQuery } from "@/lib/db-safe";
import {
  categorySectionId,
  groupServicesByCategory,
} from "@/lib/group-services-by-category";
import { CategoryImage } from "@/components/CategoryImage";
import { ServiceCard } from "@/components/ServiceCard";
import { getServiceCategoryLabel } from "@/lib/service-categories";
import { getSalonDisplaySettings } from "@/lib/salon-display";

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
      <section className="relative overflow-hidden bg-gradient-to-br from-lotus-800 via-lotus-700 to-lotus-600 px-4 py-10 text-center text-white md:py-12">
        <div className="hero-pattern absolute inset-0" />
        <div className="relative mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-light md:text-5xl">
            Hizmetlerimiz
          </h1>
          <p className="mt-3 text-sm text-rose-100/90 md:text-base">
            {sortedCategories.length} kategori · {services.length} hizmet
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {sortedCategories.length > 0 && (
          <nav
            className="sticky top-0 z-20 -mx-1 mb-12 flex flex-wrap gap-2 border-b border-rose-100 bg-cream/95 px-1 py-3 backdrop-blur-sm"
            aria-label="Hizmet kategorileri"
          >
            {sortedCategories.map((cat) => (
              <a
                key={cat}
                href={`#${categorySectionId(cat)}`}
                className="rounded-full border border-rose-200 bg-white px-3 py-1 text-[11px] font-medium text-lotus-800 transition hover:border-lotus-400 hover:bg-lotus-50"
              >
                {getServiceCategoryLabel(cat)}
                <span className="ml-1 text-gray-400">
                  ({grouped[cat].length})
                </span>
              </a>
            ))}
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
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <ServiceCard
                    key={s.id}
                    {...s}
                    showPrice={display.showPrice}
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
  );
}
