"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { serviceImageFallbackUrl, serviceImageUrl } from "@/lib/utils";

type ServiceImageProps = Omit<ImageProps, "src" | "alt"> & {
  slug: string;
  imageUrl?: string | null;
  alt: string;
};

/** Hizmet fotoğrafı — önce JPG, hata olursa SVG */
export function ServiceImage({
  slug,
  imageUrl,
  alt,
  unoptimized,
  ...props
}: ServiceImageProps) {
  const primary = serviceImageUrl(slug, imageUrl);
  const fallback = serviceImageFallbackUrl(slug);
  const [src, setSrc] = useState(primary);
  const isSvg = src.endsWith(".svg");

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      unoptimized={unoptimized ?? isSvg}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
