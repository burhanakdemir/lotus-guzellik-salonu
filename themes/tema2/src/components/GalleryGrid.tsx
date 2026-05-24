"use client";

import Image from "next/image";
import { useState } from "react";
import { galleryMediaUrl } from "@/lib/gallery";

export type GalleryItemPublic = {
  id: string;
  title: string;
  description: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
};

export function GalleryGrid({ items }: { items: GalleryItemPublic[] }) {
  const [active, setActive] = useState<GalleryItemPublic | null>(null);

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-rose-50 px-6 py-12 text-center text-gray-500">
        Galeriye henüz içerik eklenmedi.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const src = galleryMediaUrl(item.mediaUrl);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
              className="card group overflow-hidden !p-0 text-left transition hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-lotus-100">
                {item.mediaType === "VIDEO" ? (
                  <video
                    src={src}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={src}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                )}
                {item.mediaType === "VIDEO" && (
                  <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Video
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg text-rose-900">{item.title}</h3>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {item.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full bg-black">
              {active.mediaType === "VIDEO" ? (
                <video
                  src={galleryMediaUrl(active.mediaUrl)}
                  className="h-full w-full"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <Image
                  src={galleryMediaUrl(active.mediaUrl)}
                  alt={active.title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              )}
            </div>
            <div className="p-5">
              <h2 className="font-display text-2xl text-rose-900">{active.title}</h2>
              {active.description && (
                <p className="mt-2 text-gray-600">{active.description}</p>
              )}
              <button
                type="button"
                className="btn-secondary mt-4"
                onClick={() => setActive(null)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
