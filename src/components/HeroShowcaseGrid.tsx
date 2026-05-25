import Image from "next/image";
import { getShowcaseUrls } from "@/lib/showcase-images";
import type { ShowcaseFields } from "@/lib/showcase-images";

export function HeroShowcaseGrid({
  settings,
}: {
  settings: Partial<ShowcaseFields> | null;
}) {
  const urls = getShowcaseUrls(settings);

  return (
    <div className="hero-showcase" aria-label="Salon görselleri">
      {urls.map((url, index) => (
        <div key={index} className="hero-showcase__slot">
          {url ? (
            <Image
              src={url}
              alt={`İşletme görseli ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
              unoptimized
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
