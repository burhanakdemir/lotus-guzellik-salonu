"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { serviceImageFallbackUrl, serviceImageUrl } from "@/lib/utils";

type ServiceImageProps = Omit<ImageProps, "src" | "alt"> & {
  slug: string;
  imageUrl?: string | null;
  alt: string;
};

/** Hizmet fotoğrafı — önce JPG, hata olursa SVG (onError Event fırlatmaz) */
export function ServiceImage({
  slug,
  imageUrl,
  alt,
  unoptimized,
  ...props
}: ServiceImageProps) {
  const primary = serviceImageUrl(slug, imageUrl);
  const fallback = serviceImageFallbackUrl(slug);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseFallback(false);
  }, [primary]);

  const src = useFallback ? fallback : primary;
  const isSvg = src.endsWith(".svg");

  return (
    <Image
      {...props}
      key={src}
      src={src}
      alt={alt}
      unoptimized={unoptimized ?? isSvg}
      onError={() => {
        if (!useFallback) setUseFallback(true);
      }}
    />
  );
}
