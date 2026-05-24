import Link from "next/link";
import { ServiceImage } from "@/components/ServiceImage";
import { getServiceCategoryLabel } from "@/lib/service-categories";
import { formatPrice } from "@/lib/utils";

interface ServiceCardProps {
  id: string;
  name: string;
  slug: string;
  category?: string;
  description: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string | null;
  compact?: boolean;
  showPrice?: boolean;
  showDuration?: boolean;
}

export function ServiceCard({
  name,
  slug,
  category = "sac",
  description,
  durationMinutes,
  price,
  imageUrl,
  compact,
  showPrice = true,
  showDuration = true,
}: ServiceCardProps) {
  return (
    <div className="h-full rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-lotus-center p-[3px] shadow-md shadow-gold/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-gold/40">
      <article className="card card-hover group flex h-full flex-col overflow-hidden rounded-[14px] !p-0 !ring-0 hover:!ring-0">
        <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-lotus-100">
          <ServiceImage
            slug={slug}
            imageUrl={imageUrl}
            alt={name}
            fill
            className="object-cover transition duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-lotus-900/75 via-lotus-900/10 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-gold-dark via-gold to-lotus-center px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-lotus-900 shadow-md shadow-gold/30">
            {getServiceCategoryLabel(category)}
          </span>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="font-display text-2xl font-medium text-white drop-shadow-lg">
              {name}
            </h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          {!compact && (
            <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">
              {description}
            </p>
          )}
          <div className="mt-auto pt-4">
            {(showDuration || showPrice) && (
              <div
                className={`flex border-t border-rose-50 pt-4 ${
                  showDuration && showPrice
                    ? "items-end justify-between"
                    : "justify-center"
                }`}
              >
                {showDuration && (
                  <div className={showPrice ? "" : "text-center"}>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Süre</p>
                    <p className="font-medium text-gray-700">{durationMinutes} dakika</p>
                  </div>
                )}
                {showPrice && (
                  <div className={showDuration ? "text-right" : "text-center"}>
                    <p className="text-xs uppercase tracking-wider text-gray-400">KDV dahil</p>
                    <p className="font-display text-2xl font-semibold text-rose-800">
                      {formatPrice(price)}
                    </p>
                  </div>
                )}
              </div>
            )}
            <Link
              href={`/randevu?hizmet=${slug}`}
              className="btn-gold mt-4 w-full !rounded-xl !py-3 text-center !text-xs"
            >
              Randevu Al
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
