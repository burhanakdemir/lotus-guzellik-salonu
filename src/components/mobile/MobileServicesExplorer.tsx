"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CategoryImage } from "@/components/CategoryImage";
import { ServiceCard } from "@/components/ServiceCard";
import { MobilePageTitle } from "@/components/mobile/MobilePageTitle";
import { groupServicesByCategory } from "@/lib/group-services-by-category";
import { getServiceCategoryLabel } from "@/lib/service-categories";
import { shouldShowServicePrice } from "@/lib/service-price-display";

type Service = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string | null;
  showPricePublic?: boolean;
  showPriceOnHomepage?: boolean;
};

type Props = {
  services: Service[];
  showPrice: boolean;
  showDuration: boolean;
};

export function MobileServicesExplorer({
  services,
  showPrice,
  showDuration,
}: Props) {
  const { grouped, sortedCategories } = useMemo(
    () => groupServicesByCategory(services),
    [services]
  );

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  if (sortedCategories.length === 0) {
    return (
      <div className="site-mobile-only">
        <MobilePageTitle title="Hizmetlerimiz" />
        <p className="px-4 py-8 text-center text-gray-500">Henüz hizmet yok.</p>
      </div>
    );
  }

  if (!activeCategory) {
    return (
      <div className="site-mobile-only">
        <MobilePageTitle title="Hizmetlerimiz" />
        <p className="px-4 pb-3 text-sm text-lotus-800/70">
          {sortedCategories.length} kategori · {services.length} hizmet
        </p>
        <div className="grid grid-cols-2 gap-3 px-4 pb-8">
          {sortedCategories.map((cat) => {
            const count = grouped[cat].length;
            return (
              <button
                key={cat}
                type="button"
                className="mobile-category-card text-left"
                onClick={() => setActiveCategory(cat)}
              >
                <div className="mobile-category-card__image">
                  <CategoryImage
                    category={cat}
                    alt={getServiceCategoryLabel(cat)}
                    fill
                    className="object-cover"
                    sizes="50vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-lotus-900/70 to-transparent" />
                </div>
                <span className="mobile-category-card__label">
                  {getServiceCategoryLabel(cat)}
                  <span className="ml-1 font-normal opacity-90">({count})</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mx-4 mb-8 rounded-2xl bg-gradient-to-r from-lotus-700 to-lotus-900 p-6 text-center text-white">
          <p className="font-display text-xl">Karar veremediniz mi?</p>
          <Link href="/randevu" className="btn-gold mt-4 inline-flex">
            Randevu Al
          </Link>
        </div>
      </div>
    );
  }

  const items = grouped[activeCategory] ?? [];

  return (
    <div className="site-mobile-only">
      <div className="mobile-page-title">
        <button
          type="button"
          className="mobile-page-title__back"
          onClick={() => setActiveCategory(null)}
        >
          ← Kategoriler
        </button>
        <h1 className="mobile-page-title__heading">
          {getServiceCategoryLabel(activeCategory)}
        </h1>
      </div>
      <div className="sticky top-14 z-20 border-b border-lotus-100 bg-cream/95 backdrop-blur-sm">
        <div className="mobile-services-chips">
          <button
            type="button"
            className="mobile-services-chip"
            onClick={() => setActiveCategory(null)}
          >
            ← Tümü
          </button>
          {sortedCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`mobile-services-chip ${
                cat === activeCategory ? "mobile-services-chip--active" : ""
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {getServiceCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-6 px-4 py-6">
        {items.map((s) => (
          <ServiceCard
            key={s.id}
            {...s}
            showPrice={shouldShowServicePrice(showPrice, s, "public")}
            showDuration={showDuration}
          />
        ))}
      </div>
      <div className="px-4 pb-8">
        <Link
          href={`/randevu`}
          className="btn-gold flex w-full justify-center"
        >
          Bu kategoriden randevu al
        </Link>
      </div>
    </div>
  );
}
