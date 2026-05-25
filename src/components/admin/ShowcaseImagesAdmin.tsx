"use client";

import { useState } from "react";
import Image from "next/image";
import { resolveUploadPublicUrl } from "@/lib/upload-urls";
import {
  SHOWCASE_SLOT_COUNT,
  type ShowcaseFields,
  type ShowcaseSlot,
} from "@/lib/showcase-images";

type Props = {
  initial: ShowcaseFields;
};

function slotUrl(settings: ShowcaseFields, slot: ShowcaseSlot): string | null {
  const raw = settings[`showcaseImage${slot}`];
  return raw ? resolveUploadPublicUrl(raw) : null;
}

export function ShowcaseImagesAdmin({ initial }: Props) {
  const [images, setImages] = useState<ShowcaseFields>(initial);
  const [busySlot, setBusySlot] = useState<ShowcaseSlot | null>(null);
  const [error, setError] = useState("");

  async function upload(slot: ShowcaseSlot, file: File) {
    setError("");
    setBusySlot(slot);
    try {
      const form = new FormData();
      form.append("slot", String(slot));
      form.append("file", file);
      const res = await fetch("/api/admin/showcase", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Yüklenemedi");
        return;
      }
      const imageUrl = (data as { imageUrl: string }).imageUrl;
      setImages((prev) => ({ ...prev, [`showcaseImage${slot}`]: imageUrl }));
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setBusySlot(null);
    }
  }

  async function remove(slot: ShowcaseSlot) {
    setError("");
    setBusySlot(slot);
    try {
      const res = await fetch(`/api/admin/showcase?slot=${slot}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Silinemedi");
        return;
      }
      setImages((prev) => ({ ...prev, [`showcaseImage${slot}`]: null }));
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setBusySlot(null);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-gray-600">
        Ana sayfa hero bölümünde 4 eşit alan. Resim yoksa alan bordo kalır.
      </p>
      {error && (
        <p className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-700">
          {error}
        </p>
      )}
      <div className="showcase-admin-grid">
        {Array.from({ length: SHOWCASE_SLOT_COUNT }, (_, i) => {
          const slot = (i + 1) as ShowcaseSlot;
          const url = slotUrl(images, slot);
          const busy = busySlot === slot;
          return (
            <div key={slot} className="showcase-admin-slot">
              <p className="showcase-admin-slot__label">Alan {slot}</p>
              <div className="showcase-admin-slot__preview">
                {url ? (
                  <Image
                    src={url}
                    alt={`İşletme ${slot}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="showcase-admin-slot__empty">Bordo (boş)</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                <label
                  className={`showcase-admin-upload-label btn-primary !py-0.5 !text-[10px]${busy ? " showcase-admin-upload-label--busy" : ""}`}
                  aria-disabled={busy}
                >
                  {busy ? "…" : url ? "Değiştir" : "Yükle"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                    hidden
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(slot, f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {url && (
                  <button
                    type="button"
                    className="btn-secondary !py-0.5 !text-[10px] !text-red-700"
                    disabled={busy}
                    onClick={() => remove(slot)}
                  >
                    Sil
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
