"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import {
  serviceCategoryImageFallbackUrl,
  serviceCategoryImageUrl,
} from "@/lib/utils";

type CategoryImageProps = Omit<ImageProps, "src" | "alt"> & {
  category: string;
  alt: string;
};

/** Kategori banner — önce JPG, hata olursa SVG (onError Event fırlatmaz) */
export function CategoryImage({
  category,
  alt,
  unoptimized,
  ...props
}: CategoryImageProps) {
  const primary = serviceCategoryImageUrl(category);
  const fallback = serviceCategoryImageFallbackUrl(category);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseFallback(false);
  }, [category]);

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
