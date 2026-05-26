"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  GUEST_MAX_REVIEW_IMAGES,
  MEMBER_MAX_REVIEW_IMAGES,
  reviewImageUrls,
} from "@/lib/review-display";

export type ReviewItem = {
  id: string;
  content: string;
  imageUrls: string[];
  createdAt: string;
  authorName: string;
};

type MemberInfo =
  | { name: string; isMember: true }
  | { isMember: false };

function ReviewImageCarousel({
  images,
  authorName,
  onOpen,
}: {
  images: string[];
  authorName: string;
  onOpen: (startIndex: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = images[index];

  if (!current) return null;

  function goPrev() {
    setIndex((i) => (i - 1 + total) % total);
  }

  function goNext() {
    setIndex((i) => (i + 1) % total);
  }

  return (
    <div className="shrink-0">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen(index)}
          className="group block overflow-hidden rounded-xl ring-1 ring-lotus-200 transition hover:ring-lotus-400"
          aria-label={`${authorName} yorum resmini büyüt`}
        >
          <Image
            src={current}
            alt={`${authorName} yorum resmi ${index + 1}`}
            width={96}
            height={96}
            className="h-20 w-20 object-cover transition duration-300 group-hover:scale-105 sm:h-24 sm:w-24"
          />
        </button>
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xs text-white hover:bg-black/75"
              aria-label="Önceki resim"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xs text-white hover:bg-black/75"
              aria-label="Sonraki resim"
            >
              ›
            </button>
          </>
        )}
      </div>
      <p className="mt-1 text-center text-[10px] text-gray-500">
        {total > 1 ? `${index + 1} / ${total} resim` : "1 resim"}
      </p>
    </div>
  );
}

export function CustomerReviews({
  initialReviews,
  member,
  staffSlug = null,
  staffLabel = null,
}: {
  initialReviews: ReviewItem[];
  member: MemberInfo;
  /** Usta sayfasında yorum bu ustaya bağlanır */
  staffSlug?: string | null;
  staffLabel?: string | null;
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
    authorName: string;
  } | null>(null);

  const maxImages = member.isMember ? MEMBER_MAX_REVIEW_IMAGES : GUEST_MAX_REVIEW_IMAGES;

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;

    setImages((prev) => {
      const merged = [...prev, ...picked].slice(0, maxImages);
      if (prev.length + picked.length > maxImages) {
        setError(`En fazla ${maxImages} resim yükleyebilirsiniz.`);
      } else {
        setError("");
      }
      return merged;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setError("");
  }

  function clearImages() {
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("content", content);
    if (!member.isMember) {
      fd.append("guestName", guestName);
      fd.append("guestPhone", guestPhone);
      fd.append("guestEmail", guestEmail);
    }
    if (images.length > 0) {
      images.forEach((file, index) => fd.append(`image_${index}`, file));
    }
    if (staffSlug) fd.append("staffSlug", staffSlug);

    try {
      const res = await fetch("/api/reviews", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Yorum gönderilemedi.");
        return;
      }
      setContent("");
      clearImages();
      if (!member.isMember) {
        setGuestName("");
        setGuestPhone("");
        setGuestEmail("");
      }
      setSuccess(data.message || "Yorumunuz alındı.");
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshReviews() {
    const q = staffSlug ? `?staffSlug=${encodeURIComponent(staffSlug)}` : "";
    const res = await fetch(`/api/reviews${q}`);
    if (res.ok) setReviews(await res.json());
  }

  return (
    <div className="grid gap-12 max-md:flex max-md:flex-col-reverse lg:grid-cols-5">
      <div className="lg:col-span-2">
        <details className="max-md:card max-md:overflow-hidden md:contents">
          <summary className="cursor-pointer list-none px-4 py-3 font-display text-lg font-semibold text-lotus-900 md:hidden [&::-webkit-details-marker]:hidden">
            Yorum yazın +
          </summary>
          <div className="card max-md:!rounded-none max-md:!border-0 max-md:!shadow-none max-md:ring-0 md:sticky md:top-24 md:!p-5">
          <h2 className="hidden font-display text-xl text-lotus-900 md:block md:text-2xl">
            {staffLabel ? `${staffLabel} — Yorum Yazın` : "Yorum Yazın"}
          </h2>
          <p className="mt-1 text-xs leading-snug text-gray-500 md:text-sm">
            {member.isMember
              ? `${member.name}, deneyiminizi paylaşın. Yorumunuz onaylandıktan sonra yayınlanır.`
              : "Üye olmadan da yorum bırakabilirsiniz. Telefon ve e-posta bilgileriniz yalnızca doğrulama için kullanılır."}
            {staffLabel && (
              <> Bu yorum <strong>{staffLabel}</strong> için kaydedilir.</>
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</p>
            )}
            {success && (
              <p className="rounded-lg bg-green-50 px-3 py-1.5 text-xs text-green-700">
                {success}
              </p>
            )}

            {!member.isMember && (
              <>
                <div>
                  <label className="label !mb-1 !text-xs">Ad Soyad *</label>
                  <input
                    className="input !px-3 !py-2"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <label className="label !mb-1 !text-xs">Telefon *</label>
                  <input
                    className="input !px-3 !py-2"
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label !mb-1 !text-xs">E-posta *</label>
                  <input
                    className="input !px-3 !py-2"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="label !mb-1 !text-xs">Yorumunuz *</label>
              <textarea
                className="input min-h-24 resize-y !px-3 !py-2"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                minLength={10}
                maxLength={2000}
                placeholder="Salonumuzdaki deneyiminizi anlatın..."
              />
              <p className="mt-0.5 text-[11px] text-gray-400">{content.length}/2000</p>
            </div>

            <div>
              <label className="label !mb-1 !text-xs">
                Resim (opsiyonel{member.isMember ? ", en fazla 3" : ""})
              </label>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-lotus-200/80 bg-white px-3 py-2">
                <label
                  className={`btn-secondary !cursor-pointer !px-3 !py-1.5 !text-xs ${
                    images.length >= maxImages ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Resim Seç
                  <input
                    ref={fileInputRef}
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple={member.isMember}
                    disabled={images.length >= maxImages}
                    onChange={handleImageChange}
                  />
                </label>
                <span className="text-xs text-gray-500">
                  {images.length === 0
                    ? "Dosya seçilmedi"
                    : member.isMember
                      ? `${images.length}/3 resim seçildi`
                      : images[0]?.name}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-gray-400">
                JPG, PNG, WEBP veya GIF · en fazla 5 MB
                {member.isMember ? " · en fazla 3 resim" : ""}
              </p>
              {imagePreviews.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={preview}
                      className="relative overflow-hidden rounded-xl ring-1 ring-lotus-200"
                    >
                      <Image
                        src={preview}
                        alt={`Seçilen resim ${index + 1}`}
                        width={120}
                        height={120}
                        className="h-20 w-full object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white hover:bg-black/80"
                      >
                        Kaldır
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary w-full !py-2.5 !text-sm" disabled={loading}>
              {loading ? "Gönderiliyor..." : "Yorumu Gönder"}
            </button>
          </form>
          </div>
        </details>
      </div>

      <div className="lg:col-span-3 max-md:order-1">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl text-lotus-900">Onaylı Yorumlar</h2>
          <button
            type="button"
            onClick={refreshReviews}
            className="text-xs font-medium text-lotus-600 hover:text-lotus-800"
          >
            Yenile
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="card text-center text-gray-500">
            Henüz onaylanmış yorum yok. İlk yorumu siz bırakın!
          </div>
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => {
              const imgs = reviewImageUrls(review.imageUrls);
              return (
                <li key={review.id} className="card !p-4">
                  <div className="flex gap-4">
                    {imgs.length > 0 && (
                      <ReviewImageCarousel
                        images={imgs}
                        authorName={review.authorName}
                        onOpen={(startIndex) =>
                          setLightbox({
                            images: imgs,
                            index: startIndex,
                            authorName: review.authorName,
                          })
                        }
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-lotus-900">{review.authorName}</p>
                      <time className="text-xs text-gray-400" dateTime={review.createdAt}>
                        {format(new Date(review.createdAt), "d MMMM yyyy", { locale: tr })}
                      </time>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                        {review.content}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {lightbox && (
        <ReviewLightbox lightbox={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

function ReviewLightbox({
  lightbox,
  onClose,
}: {
  lightbox: { images: string[]; index: number; authorName: string };
  onClose: () => void;
}) {
  const [index, setIndex] = useState(lightbox.index);
  const total = lightbox.images.length;
  const current = lightbox.images[index];

  useEffect(() => {
    setIndex(lightbox.index);
  }, [lightbox.index, lightbox.images]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (total <= 1) return;
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + total) % total);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % total);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, total]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Yorum resmi"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-4xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Image
            src={current}
            alt={`${lightbox.authorName} yorum resmi ${index + 1}`}
            width={1200}
            height={900}
            className="max-h-[80vh] w-auto max-w-[85vw] rounded-xl object-contain shadow-2xl"
            unoptimized
          />
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + total) % total)}
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-2xl text-white hover:bg-black/80"
                aria-label="Önceki resim"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % total)}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-2xl text-white hover:bg-black/80"
                aria-label="Sonraki resim"
              >
                ›
              </button>
            </>
          )}
        </div>
        <p className="mt-3 text-sm text-white/90">
          {total > 1 ? `${index + 1} / ${total} resim` : "1 resim"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-lotus-900 shadow-lg hover:bg-lotus-50"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
