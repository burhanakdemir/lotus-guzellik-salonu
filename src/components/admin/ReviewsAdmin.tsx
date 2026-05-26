"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  MEMBER_MAX_REVIEW_IMAGES,
  reviewImageUrls,
} from "@/lib/review-display";

export type ReviewRow = {
  id: string;
  content: string;
  imageUrls: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
};

const statusLabels: Record<ReviewRow["status"], string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylı",
  REJECTED: "Reddedildi",
};

const statusClass: Record<ReviewRow["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

function reviewsApiQuery(personelSlug: string | null | undefined) {
  return personelSlug
    ? `?personel=${encodeURIComponent(personelSlug)}`
    : "";
}

export function ReviewsAdmin({
  initialReviews,
  personelSlug = null,
  scopeLabel = null,
}: {
  initialReviews: ReviewRow[];
  personelSlug?: string | null;
  scopeLabel?: string | null;
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editGuestName, setEditGuestName] = useState("");
  const [editGuestPhone, setEditGuestPhone] = useState("");
  const [editGuestEmail, setEditGuestEmail] = useState("");
  const [editKeepUrls, setEditKeepUrls] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editNewPreviews, setEditNewPreviews] = useState<string[]>([]);
  const editFileRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<"ALL" | ReviewRow["status"]>("ALL");

  useEffect(() => {
    const urls = editNewFiles.map((file) => URL.createObjectURL(file));
    setEditNewPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [editNewFiles]);

  async function refresh() {
    const res = await fetch(`/api/admin/reviews${reviewsApiQuery(personelSlug)}`);
    if (res.ok) {
      const data = (await res.json()) as Array<
        Omit<ReviewRow, "createdAt"> & { createdAt: string }
      >;
      setReviews(data);
    }
    router.refresh();
  }

  function authorLabel(review: ReviewRow) {
    if (review.user) return review.user.name;
    return review.guestName ?? "Misafir";
  }

  function contactLabel(review: ReviewRow) {
    if (review.user) {
      return `${review.user.phone}${review.user.email ? ` · ${review.user.email}` : ""}`;
    }
    return `${review.guestPhone ?? ""}${review.guestEmail ? ` · ${review.guestEmail}` : ""}`;
  }

  function startEdit(review: ReviewRow) {
    setEditingId(review.id);
    setEditContent(review.content);
    setEditGuestName(review.guestName ?? review.user?.name ?? "");
    setEditGuestPhone(review.guestPhone ?? review.user?.phone ?? "");
    setEditGuestEmail(review.guestEmail ?? review.user?.email ?? "");
    setEditKeepUrls([...review.imageUrls]);
    setEditNewFiles([]);
    if (editFileRef.current) editFileRef.current.value = "";
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNewFiles([]);
    if (editFileRef.current) editFileRef.current.value = "";
  }

  function removeKeepImage(url: string) {
    setEditKeepUrls((prev) => prev.filter((u) => u !== url));
  }

  function handleEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    const maxNew = MEMBER_MAX_REVIEW_IMAGES - editKeepUrls.length;
    setEditNewFiles((prev) => {
      const merged = [...prev, ...picked].slice(0, maxNew);
      if (prev.length + picked.length > maxNew) {
        setError(`En fazla ${MEMBER_MAX_REVIEW_IMAGES} resim olabilir.`);
      } else {
        setError("");
      }
      return merged;
    });
    if (editFileRef.current) editFileRef.current.value = "";
  }

  function removeNewImage(index: number) {
    setEditNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveEdit(id: string) {
    setError("");
    const review = reviews.find((r) => r.id === id);
    if (!review) return;

    const fd = new FormData();
    fd.append("content", editContent.trim());
    fd.append("keepImageUrls", JSON.stringify(editKeepUrls));
    if (!review.user) {
      fd.append("guestName", editGuestName.trim());
      fd.append("guestPhone", editGuestPhone.trim());
      fd.append("guestEmail", editGuestEmail.trim());
    }
    editNewFiles.forEach((file, index) => fd.append(`image_${index}`, file));

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi.");
        return;
      }
      cancelEdit();
      await refresh();
    } catch {
      setError("Bağlantı hatası.");
    }
  }

  async function setStatus(id: string, status: ReviewRow["status"]) {
    setError("");
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Güncellenemedi.");
        return;
      }
      await refresh();
    } catch {
      setError("Bağlantı hatası.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Silinemedi.");
        return;
      }
      if (editingId === id) cancelEdit();
      await refresh();
    } catch {
      setError("Bağlantı hatası.");
    }
  }

  const filtered =
    filter === "ALL" ? reviews : reviews.filter((r) => r.status === filter);

  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded px-2 py-1 text-xs font-medium ${
              filter === f ? "bg-lotus-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "ALL" ? "Tümü" : statusLabels[f]}
            {f === "PENDING" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">Bu filtrede yorum yok.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div key={review.id} className="card !p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{authorLabel(review)}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusClass[review.status]}`}
                    >
                      {statusLabels[review.status]}
                    </span>
                    {review.user ? (
                      <span className="text-[10px] text-gray-400">Üye</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Misafir</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{contactLabel(review)}</p>
                  <time className="text-[10px] text-gray-400">
                    {format(new Date(review.createdAt), "d MMM yyyy HH:mm", { locale: tr })}
                  </time>
                </div>
                <div className="flex flex-wrap gap-1">
                  {review.status !== "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => setStatus(review.id, "APPROVED")}
                      className="rounded bg-green-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-green-700"
                    >
                      Onayla
                    </button>
                  )}
                  {review.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => setStatus(review.id, "REJECTED")}
                      className="rounded bg-amber-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-amber-600"
                    >
                      Reddet
                    </button>
                  )}
                  {editingId !== review.id && (
                    <button
                      type="button"
                      onClick={() => startEdit(review)}
                      className="rounded bg-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-300"
                    >
                      Düzenle
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(review.id)}
                    className="rounded bg-red-100 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-200"
                  >
                    Sil
                  </button>
                </div>
              </div>

              {editingId === review.id ? (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                  {!review.user && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        className="input !py-2 !text-xs"
                        value={editGuestName}
                        onChange={(e) => setEditGuestName(e.target.value)}
                        placeholder="Ad soyad"
                      />
                      <input
                        className="input !py-2 !text-xs"
                        value={editGuestPhone}
                        onChange={(e) => setEditGuestPhone(e.target.value)}
                        placeholder="Telefon"
                      />
                      <input
                        className="input !py-2 !text-xs"
                        value={editGuestEmail}
                        onChange={(e) => setEditGuestEmail(e.target.value)}
                        placeholder="E-posta"
                      />
                    </div>
                  )}
                  <textarea
                    className="input min-h-24 !text-xs"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div>
                    <p className="text-[11px] font-medium text-gray-600">Resimler</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {editKeepUrls.map((url, index) => {
                        const src = reviewImageUrls([url])[0];
                        if (!src) return null;
                        return (
                          <div key={url} className="relative overflow-hidden rounded-lg ring-1 ring-gray-200">
                            <Image
                              src={src}
                              alt={`Mevcut resim ${index + 1}`}
                              width={80}
                              height={80}
                              className="h-16 w-16 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeKeepImage(url)}
                              className="absolute right-0.5 top-0.5 rounded bg-red-600 px-1 py-0.5 text-[9px] text-white"
                            >
                              Sil
                            </button>
                          </div>
                        );
                      })}
                      {editNewPreviews.map((preview, index) => (
                        <div
                          key={preview}
                          className="relative overflow-hidden rounded-lg ring-1 ring-lotus-300"
                        >
                          <Image
                            src={preview}
                            alt={`Yeni resim ${index + 1}`}
                            width={80}
                            height={80}
                            className="h-16 w-16 object-cover"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute right-0.5 top-0.5 rounded bg-red-600 px-1 py-0.5 text-[9px] text-white"
                          >
                            Sil
                          </button>
                        </div>
                      ))}
                    </div>
                    {editKeepUrls.length + editNewFiles.length < MEMBER_MAX_REVIEW_IMAGES && (
                      <label className="mt-2 inline-flex cursor-pointer rounded bg-gray-100 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-200">
                        Resim Ekle
                        <input
                          ref={editFileRef}
                          className="sr-only"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          onChange={handleEditImageChange}
                        />
                      </label>
                    )}
                    <p className="mt-1 text-[10px] text-gray-400">
                      {editKeepUrls.length + editNewFiles.length}/{MEMBER_MAX_REVIEW_IMAGES} resim
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(review.id)}
                      className="btn-primary !py-1.5 !px-3 !text-xs"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{review.content}</p>
                  {reviewImageUrls(review.imageUrls).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {reviewImageUrls(review.imageUrls).map((img, index) => (
                        <div
                          key={img}
                          className="overflow-hidden rounded-lg ring-1 ring-gray-200"
                        >
                          <Image
                            src={img}
                            alt={`Yorum resmi ${index + 1}`}
                            width={120}
                            height={120}
                            className="h-20 w-20 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
