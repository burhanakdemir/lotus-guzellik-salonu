import Image from "next/image";
import Link from "next/link";
import { ServiceImage } from "@/components/ServiceImage";
import type { WeeklyPromotion } from "@/components/WeeklyPromotions";
import {
  formatPrice,
  formatPromotionServicesLabel,
  promotionDisplayImageUrl,
} from "@/lib/utils";

function discountLabel(p: WeeklyPromotion): string {
  return p.discountType === "PERCENT"
    ? `%${p.discountValue} indirim`
    : `${formatPrice(p.discountValue)} indirim`;
}

export function MobilePromoCarousel({ promotions }: { promotions: WeeklyPromotion[] }) {
  if (promotions.length === 0) return null;

  return (
    <section className="py-4">
      <h2 className="px-4 font-display text-lg font-semibold text-lotus-900">
        Haftanın Kampanyaları
      </h2>
      <div className="mobile-promo-scroll mt-3">
        {promotions.map((promo) => {
          const firstService = promo.services[0]?.service;
          const useServicePhoto = Boolean(firstService) && !promo.bannerUrl;
          const src = promotionDisplayImageUrl(promo);

          return (
            <article key={promo.id} className="mobile-promo-card">
              <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-lg bg-lotus-100">
                {useServicePhoto && firstService ? (
                  <ServiceImage
                    slug={firstService.slug}
                    imageUrl={firstService.imageUrl}
                    alt={promo.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <Image
                    src={src}
                    alt={promo.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized={src.endsWith(".svg") || src.includes("/api/files/")}
                  />
                )}
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-lotus-900">
                {promo.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-lotus-800/70">
                {formatPromotionServicesLabel(promo)}
              </p>
              <p className="mt-2 text-sm font-bold text-lotus-600">{discountLabel(promo)}</p>
              <Link href="/randevu" className="btn-gold mt-3 w-full !py-2.5 !text-xs">
                Randevu Al
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
