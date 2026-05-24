"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { serviceImageFallbackUrl, serviceImageUrl } from "@/lib/utils";

const W = 56;
const H = 48;

/** Admin tablo küçük görseli — fill kullanmaz (CSS yüklenmese bile taşmaz) */
export function AdminServiceThumb({
  slug,
  imageUrl,
  alt,
}: {
  slug: string;
  imageUrl?: string | null;
  alt: string;
}) {
  const primary = serviceImageUrl(slug, imageUrl);
  const fallback = serviceImageFallbackUrl(slug);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseFallback(false);
  }, [primary]);

  const src = useFallback ? fallback : primary;

  return (
    <div
      className="services-admin__thumb"
      style={{
        position: "relative",
        width: W,
        height: H,
        minWidth: W,
        minHeight: H,
        overflow: "hidden",
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={W}
        height={H}
        className="object-cover"
        style={{ width: "100%", height: "100%", display: "block" }}
        unoptimized
        onError={() => {
          if (!useFallback) setUseFallback(true);
        }}
      />
    </div>
  );
}
