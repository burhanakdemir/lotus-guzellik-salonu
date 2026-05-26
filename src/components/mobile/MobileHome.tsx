import Image from "next/image";
import Link from "next/link";
import { ServiceCard } from "@/components/ServiceCard";
import { MobilePromoCarousel } from "@/components/mobile/MobilePromoCarousel";
import type { WeeklyPromotion } from "@/components/WeeklyPromotions";

type FeaturedService = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  imageUrl: string | null;
};

type Props = {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  promotions: WeeklyPromotion[];
  featured: FeaturedService[];
  serviceCount: number;
  showPrice: boolean;
  showDuration: boolean;
};

export function MobileHome({
  heroTitle,
  heroSubtitle,
  promotions,
  featured,
  serviceCount,
  showPrice,
  showDuration,
}: Props) {
  const topFeatured = featured.slice(0, 3);

  return (
    <div className="site-mobile-only">
      <section className="mobile-hero relative">
        <Image
          src="/hero-bg.svg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        <div className="hero-pattern absolute inset-0 opacity-30" />
        <div className="mobile-hero__overlay" />
        <div className="mobile-hero__content">
          <h1 className="mobile-hero__title">{heroTitle}</h1>
          {heroSubtitle && <p className="mobile-hero__subtitle">{heroSubtitle}</p>}
          <Link href="/randevu" className="btn-gold mt-5 inline-flex w-full justify-center">
            Randevu Al
          </Link>
          <p className="mt-3 text-center text-xs text-lotus-100/90">
            <Link href="/hakkimizda" className="underline underline-offset-2">
              Neden LOTUS?
            </Link>
            {" · "}
            Antalya Kepez
          </p>
        </div>
      </section>

      <MobilePromoCarousel promotions={promotions} />

      {topFeatured.length > 0 && (
        <section className="px-4 pb-6">
          <h2 className="font-display text-lg font-semibold text-lotus-900">
            Öne Çıkan Hizmetler
          </h2>
          <div className="mt-4 space-y-6">
            {topFeatured.map((s) => (
              <ServiceCard
                key={s.id}
                {...s}
                compact
                showPrice={showPrice}
                showDuration={showDuration}
              />
            ))}
          </div>
          <Link
            href="/hizmetler"
            className="btn-secondary mt-6 flex w-full justify-center"
          >
            Tüm {serviceCount} hizmeti gör
          </Link>
        </section>
      )}

      <section className="space-y-3 px-4 pb-8">
        <h2 className="font-display text-lg font-semibold text-lotus-900">Keşfet</h2>
        <Link href="/galeri" className="mobile-section-link">
          <span>Galeri</span>
          <span aria-hidden>→</span>
        </Link>
        <Link href="/yorumlar" className="mobile-section-link">
          <span>Müşteri yorumları</span>
          <span aria-hidden>→</span>
        </Link>
        <Link href="/hakkimizda" className="mobile-section-link">
          <span>Hakkımızda & çalışma saatleri</span>
          <span aria-hidden>→</span>
        </Link>
      </section>
    </div>
  );
}
