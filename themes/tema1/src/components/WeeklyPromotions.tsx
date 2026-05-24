import Link from "next/link";
import {
  formatPrice,
  formatPromotionServicesLabel,
} from "@/lib/utils";

export type WeeklyPromotion = {
  id: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  allServices: boolean;
  bannerUrl: string | null;
  services: { service: { name: string } }[];
};

function discountLabel(p: WeeklyPromotion): string {
  return p.discountType === "PERCENT"
    ? `%${p.discountValue} indirim`
    : `${formatPrice(p.discountValue)} indirim`;
}

function PromoTextBlock({
  promo,
  compact,
}: {
  promo: WeeklyPromotion;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <h2
        className={
          compact
            ? "font-display text-lg font-semibold leading-tight text-lotus-900 md:text-xl"
            : "font-display mt-3 text-2xl font-semibold text-lotus-900 md:text-3xl"
        }
      >
        {promo.title}
      </h2>
      {promo.description && (
        <p
          className={
            compact
              ? "mt-1.5 line-clamp-2 text-xs leading-snug text-gray-600"
              : "mt-2 text-sm text-gray-600"
          }
        >
          {promo.description}
        </p>
      )}
      <p
        className={
          compact
            ? "mt-1 text-xs font-semibold text-lotus-700"
            : "mt-2 text-sm font-semibold text-lotus-700"
        }
      >
        {discountLabel(promo)}
      </p>
      <p
        className={
          promo.allServices
            ? compact
              ? "mt-1 inline-flex rounded-full bg-lotus-50 px-2.5 py-0.5 text-[10px] font-medium text-lotus-800 ring-1 ring-lotus-200"
              : "mt-2 inline-flex rounded-full bg-lotus-50 px-3 py-1 text-xs font-medium text-lotus-800 ring-1 ring-lotus-200"
            : compact
              ? "mt-1 line-clamp-1 text-[10px] text-lotus-700"
              : "mt-2 text-xs text-lotus-700 md:text-sm"
        }
      >
        {formatPromotionServicesLabel(promo)}
      </p>
    </div>
  );
}

export function WeeklyPromotions({
  promotions,
}: {
  promotions: WeeklyPromotion[];
}) {
  if (promotions.length === 0) return null;

  const multiple = promotions.length > 1;
  const colsClass =
    promotions.length === 2
      ? "md:grid-cols-2"
      : promotions.length >= 3
        ? "md:grid-cols-3"
        : "";

  return (
    <section className="relative z-20 mx-auto -mt-10 mb-2 max-w-5xl px-4 lg:px-8">
      <div className="overflow-hidden rounded-2xl border-y-4 border-white shadow-2xl">
        <div className="rounded-2xl bg-gradient-to-br from-lotus-700 via-lotus-800 to-lotus-900 px-[3px] py-0 md:px-1">
          <div className="flex min-h-[12.5rem] items-center rounded-[14px] bg-white px-6 py-7 md:min-h-[13.5rem] md:px-7 md:py-8">
            <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-dark to-gold px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-md">
                  {multiple
                    ? "✦ Haftanın Kampanyaları"
                    : "✦ Haftanın Kampanyası"}
                </span>

                {multiple ? (
                  <div
                    className={`mt-3 grid grid-cols-1 gap-4 ${colsClass} md:gap-5`}
                  >
                    {promotions.map((p, i) => (
                      <div
                        key={p.id}
                        className={`min-w-0 ${i > 0 ? "md:border-l md:border-lotus-100 md:pl-5" : ""}`}
                      >
                        <PromoTextBlock promo={p} compact />
                      </div>
                    ))}
                  </div>
                ) : (
                  <PromoTextBlock promo={promotions[0]} />
                )}
              </div>

              <Link href="/randevu" className="btn-gold shrink-0">
                Hemen Randevu Al
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
