"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import {
  serviceCategoryImageFallbackUrl,
  serviceCategoryImageUrl,
} from "@/lib/utils";

type CategoryImageProps = Omit<ImageProps, "src" | "alt"> & {
  category: string;
  alt: string;
};

/** Kategori banner — önce JPG, hata olursa SVG */
export function CategoryImage({
  category,
  alt,
  unoptimized,
  ...props
}: CategoryImageProps) {
  const primary = serviceCategoryImageUrl(category);
  const fallback = serviceCategoryImageFallbackUrl(category);
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
