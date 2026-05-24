"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Promo {
  id: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  startDate: Date | string;
  endDate: Date | string;
  allServices: boolean;
  bannerUrl: string | null;
  services: { service: { id: string; name: string } }[];
}

interface ServiceOption {
  id: string;
  name: string;
}

const defaultForm = () => ({
  title: "Kampanya",
  description:
    "Seçili hizmetlerde %15 indirim! Bu hafta randevunuzu hemen alın.",
  discountType: "PERCENT" as "PERCENT" | "FIXED",
  discountValue: 15,
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  allServices: true,
  serviceIds: [] as string[],
});

function formatPromoServices(p: Promo): string {
  if (p.allServices) return "Tüm hizmetler";
  if (p.services.length === 0) return "Hizmet seçilmedi";
  return p.services.map((s) => s.service.name).join(", ");
}

export function PromotionsAdmin({
  initialPromotions,
  services,
}: {
  initialPromotions: Promo[];
  services: ServiceOption[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  async function deletePromotion(id: string, title: string) {
    if (!confirm(`"${title}" kampanyası silinsin mi? Bu işlem geri alınamaz.`)) {
      return;
    }
    const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Kampanya silinemedi.");
      return;
    }
    setError("");
    router.refresh();
  }

  async function updatePromotion(
    id: string,
    data: { description?: string; title?: string }
  ) {
    const res = await fetch(`/api/admin/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setError("Kampanya güncellenemedi.");
      return;
    }
    setError("");
    router.refresh();
  }

  async function uploadBanner(promoId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", promoId);
    fd.append("type", "promotion");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.imageUrl) {
      await fetch(`/api/admin/promotions/${promoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerUrl: data.imageUrl }),
      });
    }
  }

  function toggleService(serviceId: string) {
    setForm((prev) => {
      const has = prev.serviceIds.includes(serviceId);
      return {
        ...prev,
        serviceIds: has
          ? prev.serviceIds.filter((id) => id !== serviceId)
          : [...prev.serviceIds, serviceId],
      };
    });
  }

  function selectAllServices() {
    setForm((prev) => ({
      ...prev,
      serviceIds: services.map((s) => s.id),
    }));
  }

  function clearServiceSelection() {
    setForm((prev) => ({ ...prev, serviceIds: [] }));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.allServices && form.serviceIds.length === 0) {
      setError("En az bir hizmet seçin veya “Tüm hizmetler”i işaretleyin.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setError("Kampanya oluşturulamadı. Bilgileri kontrol edin.");
        return;
      }
      const created = await res.json();
      if (bannerFile) await uploadBanner(created.id, bannerFile);
      setForm(defaultForm());
      setBannerFile(null);
      setShowForm(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="promo-admin space-y-3">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          setShowForm(!showForm);
          setError("");
        }}
      >
        {showForm ? "İptal" : "+ Yeni kampanya"}
      </button>

      {showForm && (
        <form onSubmit={create} className="card promo-admin__form space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Başlık</label>
              <input
                className="input w-full"
                placeholder="Örn: Bahar indirimi"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Ana sayfa açıklaması</label>
              <textarea
                className="input w-full min-h-[4rem] resize-y"
                rows={3}
                placeholder="Örn: Seçili hizmetlerde %15 indirim! Bu hafta randevunuzu hemen alın."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <p className="mt-1 text-[10px] text-gray-500">
                Bu metin ana sayfadaki kampanya kartında, başlığın altında gri
                satır olarak görünür.
              </p>
            </div>
            <div>
              <label className="label">İndirim türü</label>
              <select
                className="input w-full"
                value={form.discountType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountType: e.target.value as "PERCENT" | "FIXED",
                  })
                }
              >
                <option value="PERCENT">Yüzde (%)</option>
                <option value="FIXED">Sabit tutar (₺)</option>
              </select>
            </div>
            <div>
              <label className="label">
                İndirim {form.discountType === "PERCENT" ? "(%)" : "(₺)"}
              </label>
              <input
                className="input w-full"
                type="number"
                min={1}
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="label">Başlangıç</label>
              <input
                className="input w-full"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Bitiş</label>
              <input
                className="input w-full"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <fieldset className="promo-admin__services-field">
            <legend className="label !mb-2">Geçerli hizmetler</legend>
            <div className="promo-admin__scope">
              <label className="promo-admin__scope-option">
                <input
                  type="radio"
                  name="promoScope"
                  checked={form.allServices}
                  onChange={() =>
                    setForm({ ...form, allServices: true, serviceIds: [] })
                  }
                />
                <span>Tüm hizmetler</span>
              </label>
              <label className="promo-admin__scope-option">
                <input
                  type="radio"
                  name="promoScope"
                  checked={!form.allServices}
                  onChange={() =>
                    setForm({ ...form, allServices: false, serviceIds: [] })
                  }
                />
                <span>Seçili hizmetler</span>
              </label>
            </div>

            {!form.allServices && (
              <div className="promo-admin__service-picker">
                <div className="promo-admin__service-actions">
                  <button
                    type="button"
                    className="text-[11px] font-medium text-lotus-700 hover:underline"
                    onClick={selectAllServices}
                  >
                    Tümünü seç
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-gray-600 hover:underline"
                    onClick={clearServiceSelection}
                  >
                    Temizle
                  </button>
                  <span className="ml-auto text-[11px] text-gray-500">
                    {form.serviceIds.length} / {services.length} seçili
                  </span>
                </div>
                {services.length === 0 ? (
                  <p className="text-[11px] text-gray-500">
                    Aktif hizmet bulunamadı. Önce hizmet ekleyin.
                  </p>
                ) : (
                  <ul className="promo-admin__service-list">
                    {services.map((s) => {
                      const checked = form.serviceIds.includes(s.id);
                      return (
                        <li key={s.id}>
                          <label
                            className={
                              checked
                                ? "promo-admin__service-item promo-admin__service-item--checked"
                                : "promo-admin__service-item"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleService(s.id)}
                            />
                            <span>{s.name}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </fieldset>

          <div>
            <label className="label">Kampanya görseli (ana sayfa)</label>
            <input
              className="input w-full max-w-md"
              type="file"
              accept="image/*"
              onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-[10px] text-gray-500">
              Önerilen: yatay görsel (16:10). Yüklenmezse varsayılan kullanılır.
            </p>
          </div>

          {error && (
            <p className="text-[11px] font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full sm:w-auto"
            disabled={submitting}
          >
            {submitting ? "Kaydediliyor…" : "Kampanya oluştur"}
          </button>
        </form>
      )}

      <div className="card promo-admin__table-wrap !p-0">
        <table className="promo-admin__table w-full">
          <thead>
            <tr>
              <th className="promo-admin__th">Görsel</th>
              <th className="promo-admin__th">Başlık</th>
              <th className="promo-admin__th">Ana sayfa metni</th>
              <th className="promo-admin__th">İndirim</th>
              <th className="promo-admin__th">Hizmetler</th>
              <th className="promo-admin__th">Tarih</th>
              <th className="promo-admin__th promo-admin__th--actions">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {initialPromotions.length === 0 ? (
              <tr>
                <td colSpan={7} className="promo-admin__empty">
                  Henüz kampanya yok.
                </td>
              </tr>
            ) : (
              initialPromotions.map((p) => (
                <tr key={p.id} className="promo-admin__row">
                  <td className="promo-admin__td">
                    <label className="services-admin__btn services-admin__btn--upload cursor-pointer">
                      {p.bannerUrl ? "Değiştir" : "Yükle"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            await uploadBanner(p.id, f);
                            router.refresh();
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </td>
                  <td className="promo-admin__td">
                    <span className="font-medium">{p.title}</span>
                  </td>
                  <td className="promo-admin__td promo-admin__td--desc">
                    <textarea
                      className="input min-h-[3rem] w-full min-w-[12rem] text-[11px] leading-snug"
                      defaultValue={p.description}
                      placeholder="Ana sayfada görünecek açıklama…"
                      rows={2}
                      onBlur={(e) => {
                        const next = e.target.value.trim();
                        if (next !== (p.description ?? "").trim()) {
                          updatePromotion(p.id, { description: next });
                        }
                      }}
                    />
                  </td>
                  <td className="promo-admin__td promo-admin__td--discount">
                    {p.discountType === "PERCENT"
                      ? `%${p.discountValue}`
                      : `${p.discountValue} ₺`}
                  </td>
                  <td className="promo-admin__td">
                    <span
                      className={
                        p.allServices
                          ? "promo-admin__services-badge promo-admin__services-badge--all"
                          : "promo-admin__services-badge"
                      }
                      title={formatPromoServices(p)}
                    >
                      {formatPromoServices(p)}
                    </span>
                  </td>
                  <td className="promo-admin__td promo-admin__td--date">
                    {new Date(p.startDate).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    {" – "}
                    {new Date(p.endDate).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="promo-admin__td promo-admin__td--actions">
                    <button
                      type="button"
                      className="services-admin__btn services-admin__btn--delete"
                      onClick={() => deletePromotion(p.id, p.title)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
