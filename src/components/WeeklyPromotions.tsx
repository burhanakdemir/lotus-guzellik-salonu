import Image from "next/image";
import Link from "next/link";
import { ServiceImage } from "@/components/ServiceImage";
import {
  formatPrice,
  formatPromotionServicesLabel,
  promotionDisplayImageUrl,
} from "@/lib/utils";

export type WeeklyPromotion = {
  id: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  allServices: boolean;
  bannerUrl: string | null;
  services: {
    service: { name: string; slug: string; imageUrl: string | null };
  }[];
};

function discountLabel(p: WeeklyPromotion): string {
  return p.discountType === "PERCENT"
    ? `%${p.discountValue} indirim`
    : `${formatPrice(p.discountValue)} indirim`;
}

function PromoThumb({
  promo,
  large,
}: {
  promo: WeeklyPromotion;
  large?: boolean;
}) {
  const firstService = promo.services[0]?.service;
  const useServicePhoto = Boolean(firstService) && !promo.bannerUrl;

  const boxClass = large
    ? "relative mx-auto h-[8.5rem] w-[10.5rem] max-w-full shrink-0 overflow-hidden rounded-lg bg-lotus-100 ring-1 ring-lotus-200/80"
    : "relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-lotus-100 ring-1 ring-lotus-200/80";

  if (useServicePhoto && firstService) {
    return (
      <div className={boxClass}>
        <ServiceImage
          slug={firstService.slug}
          imageUrl={firstService.imageUrl}
          alt={promo.title}
          fill
          className="object-cover"
          sizes={large ? "168px" : "64px"}
        />
      </div>
    );
  }

  const src = promotionDisplayImageUrl(promo);
  const isPlaceholder = src.endsWith(".svg");

  return (
    <div className={boxClass}>
      <Image
        src={src}
        alt={promo.title}
        fill
        className="object-cover"
        sizes={large ? "168px" : "64px"}
        unoptimized={isPlaceholder || src.includes("/api/files/")}
      />
    </div>
  );
}

function PromoTextBlock({
  promo,
  compact,
  showDiscountLine = true,
}: {
  promo: WeeklyPromotion;
  compact?: boolean;
  showDiscountLine?: boolean;
}) {
  return (
    <div className="min-w-0 text-center md:text-left">
      <h2
        className={
          compact
            ? "font-display text-base font-semibold leading-tight text-lotus-900 line-clamp-2 md:text-lg"
            : "font-display mt-3 text-2xl font-semibold text-lotus-900 md:text-3xl"
        }
      >
        {promo.title}
      </h2>
      {promo.description && (
        <p
          className={
            compact
              ? "mt-1 line-clamp-1 text-[11px] leading-snug text-gray-600"
              : "mt-2 text-sm text-gray-600"
          }
        >
          {promo.description}
        </p>
      )}
      {showDiscountLine && !compact && (
        <p className="mt-2 text-sm font-semibold text-lotus-700">
          {discountLabel(promo)}
        </p>
      )}
      <p
        className={
          promo.allServices
            ? compact
              ? "mt-1 inline-flex rounded-full bg-lotus-50 px-2 py-0.5 text-[10px] font-medium text-lotus-800 ring-1 ring-lotus-200"
              : "mt-2 inline-flex rounded-full bg-lotus-50 px-3 py-1 text-xs font-medium text-lotus-800 ring-1 ring-lotus-200"
            : compact
              ? "mt-1 line-clamp-2 text-[10px] leading-snug text-lotus-700"
              : "mt-2 text-xs text-lotus-700 md:text-sm"
        }
      >
        {formatPromotionServicesLabel(promo)}
      </p>
    </div>
  );
}

/** 2–3 kampanya: üstte bilgi, altta görsel + indirim */
function PromoColumn({
  promo,
  bordered,
}: {
  promo: WeeklyPromotion;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col ${bordered ? "md:border-l md:border-lotus-100 md:pl-4" : ""}`}
    >
      <div className="min-h-[5.25rem] shrink-0">
        <PromoTextBlock promo={promo} compact showDiscountLine={false} />
      </div>
      <div className="mt-auto flex flex-col items-center pt-2 md:items-center">
        <PromoThumb promo={promo} large />
        <p className="mt-1.5 text-center text-xs font-semibold text-lotus-700">
          {discountLabel(promo)}
        </p>
      </div>
    </div>
  );
}

export function WeeklyPromotions({
  promotions,
  variant = "home",
}: {
  promotions: WeeklyPromotion[];
  variant?: "home" | "panel";
}) {
  if (promotions.length === 0) return null;

  const multiple = promotions.length > 1;
  const colsClass =
    promotions.length === 2
      ? "md:grid-cols-2"
      : promotions.length >= 3
        ? "md:grid-cols-3"
        : "";

  if (variant === "panel") {
    const panelGridCols =
      promotions.length === 1
        ? "max-w-sm mx-auto"
        : promotions.length === 2
          ? "md:grid-cols-2"
          : "md:grid-cols-3";

    return (
      <div
        className={`grid grid-cols-1 items-stretch gap-6 ${panelGridCols} md:gap-5`}
      >
        {promotions.map((p, i) => (
          <PromoColumn
            key={p.id}
            promo={p}
            bordered={i > 0 && multiple}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="relative z-20 mx-auto -mt-10 mb-2 max-w-6xl px-4 lg:px-8">
      <div className="overflow-hidden rounded-2xl border-y-4 border-white shadow-2xl">
        <div className="rounded-2xl bg-gradient-to-br from-lotus-700 via-lotus-800 to-lotus-900 px-[3px] py-0 md:px-1">
          <div className="flex min-h-[12.5rem] items-center rounded-[14px] bg-white px-4 py-7 sm:px-6 md:min-h-[13.5rem] md:px-7 md:py-8">
            <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-dark to-gold px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-md">
                  {multiple
                    ? "✦ Haftanın Kampanyaları"
                    : "✦ Haftanın Kampanyası"}
                </span>

                {multiple ? (
                  <div
                    className={`mt-2 grid grid-cols-1 items-stretch gap-4 ${colsClass} md:gap-3`}
                  >
                    {promotions.map((p, i) => (
                      <PromoColumn
                        key={p.id}
                        promo={p}
                        bordered={i > 0}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex items-start gap-3">
                    <PromoThumb promo={promotions[0]} />
                    <PromoTextBlock promo={promotions[0]} />
                  </div>
                )}
              </div>

              <Link
                href="/randevu"
                className="btn-gold w-full shrink-0 text-center md:w-auto"
              >
                Hemen Randevu Al
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
