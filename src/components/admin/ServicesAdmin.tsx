"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { AdminServiceThumb } from "@/components/admin/AdminServiceThumb";
import { groupServicesByCategory } from "@/lib/group-services-by-category";
import {
  getServiceCategoryLabel,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CATEGORY_ORDER,
} from "@/lib/service-categories";
import { updateServiceDisplaySettings } from "@/app/admin/ayarlar/actions";
import { formatPrice } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  showPricePublic: boolean;
  showPriceOnHomepage: boolean;
}

type EditField = "name" | "durationMinutes" | "price";

export function ServicesAdmin({
  initialServices,
  initialShowPrice = true,
  initialShowDuration = true,
}: {
  initialServices: Service[];
  initialShowPrice?: boolean;
  initialShowDuration?: boolean;
}) {
  const [services, setServices] = useState(initialServices);
  const [showPrice, setShowPrice] = useState(initialShowPrice);
  const [showDuration, setShowDuration] = useState(initialShowDuration);
  const [displaySaving, setDisplaySaving] = useState(false);
  const [edit, setEdit] = useState<{ id: string; field: EditField } | null>(null);
  const [draft, setDraft] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "fon-bakim",
    description: "",
    durationMinutes: 30,
    price: 100,
    isFeatured: false,
    showPricePublic: true,
    showPriceOnHomepage: false,
  });

  const { grouped, sortedCategories } = useMemo(
    () => groupServicesByCategory(services),
    [services]
  );

  const reloadServices = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/services", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setServices(data);
    } catch {
      /* ağ hatası */
    }
  }, []);

  /** Tek alan güncelle — tam liste yenileme yok (performans) */
  const patchService = useCallback(
    async (id: string, data: Partial<Service>, optimistic = true) => {
      if (optimistic) {
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...data } : s))
        );
      }
      try {
        const res = await fetch(`/api/admin/services/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          await reloadServices();
          return false;
        }
        const updated = (await res.json()) as Service;
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
        );
        return true;
      } catch {
        await reloadServices();
        return false;
      }
    },
    [reloadServices]
  );

  async function createService(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({
      name: "",
      category: "fon-bakim",
      description: "",
      durationMinutes: 30,
      price: 100,
      isFeatured: false,
      showPricePublic: true,
      showPriceOnHomepage: false,
    });
    setShowAdd(false);
    reloadServices();
  }

  async function deleteService(id: string) {
    if (!confirm("Silinsin mi?")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    } else {
      await reloadServices();
    }
  }

  function startEdit(service: Service, field: EditField) {
    setEdit({ id: service.id, field });
    if (field === "name") setDraft(service.name);
    else if (field === "durationMinutes") setDraft(String(service.durationMinutes));
    else setDraft(String(service.price));
  }

  function cancelEdit() {
    setEdit(null);
    setDraft("");
  }

  async function saveEdit(service: Service) {
    if (!edit || edit.id !== service.id) return;

    if (edit.field === "name") {
      const name = draft.trim();
      if (name.length < 2) {
        alert("Hizmet adı en az 2 karakter olmalı.");
        return;
      }
      if (name === service.name) {
        cancelEdit();
        return;
      }
      await patchService(service.id, { name }, false);
    } else if (edit.field === "durationMinutes") {
      const durationMinutes = parseInt(draft, 10);
      if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
        alert("Geçerli bir süre (dakika) girin.");
        return;
      }
      if (durationMinutes === service.durationMinutes) {
        cancelEdit();
        return;
      }
      await patchService(service.id, { durationMinutes }, false);
    } else {
      const price = parseFloat(draft);
      if (!Number.isFinite(price) || price <= 0) {
        alert("Geçerli bir fiyat girin.");
        return;
      }
      if (price === service.price) {
        cancelEdit();
        return;
      }
      await patchService(service.id, { price }, false);
    }
    cancelEdit();
  }

  async function toggleDisplay(
    field: "showServicePrice" | "showServiceDuration",
    value: boolean
  ) {
    const prevPrice = showPrice;
    const prevDuration = showDuration;
    const prevServices = services;

    setDisplaySaving(true);
    try {
      if (field === "showServicePrice") {
        setShowPrice(value);
        if (!value) {
          setServices((prev) =>
            prev.map((s) => ({
              ...s,
              showPricePublic: false,
              showPriceOnHomepage: false,
            }))
          );
        }
        await updateServiceDisplaySettings({ showServicePrice: value });
      } else {
        setShowDuration(value);
        await updateServiceDisplaySettings({ showServiceDuration: value });
      }
    } catch {
      if (field === "showServicePrice") setShowPrice(prevPrice);
      else setShowDuration(prevDuration);
      setServices(prevServices);
      alert("Kaydedilemedi.");
    } finally {
      setDisplaySaving(false);
    }
  }

  async function uploadImage(id: string, slug: string, file: File) {
    if (file.size > 8 * 1024 * 1024) {
      alert("Dosya en fazla 8 MB olabilir.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", slug);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Görsel yüklenemedi.");
        return;
      }
      if (!data.imageUrl) {
        alert("Sunucu görsel adresi döndürmedi.");
        return;
      }
      const ok = await patchService(id, { imageUrl: data.imageUrl }, false);
      if (!ok) {
        alert("Veritabanına kaydedilemedi.");
      }
    } catch {
      alert("Yükleme sırasında bağlantı hatası.");
    }
  }

  return (
    <div className="services-admin space-y-3">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setShowAdd(!showAdd)}
      >
        {showAdd ? "İptal" : "+ Yeni hizmet"}
      </button>

      {showAdd && (
        <form onSubmit={createService} className="card grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            className="input"
            placeholder="Ad"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {SERVICE_CATEGORY_ORDER.map((key) => (
              <option key={key} value={key}>
                {SERVICE_CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="number"
            placeholder="Dk"
            value={form.durationMinutes}
            onChange={(e) =>
              setForm({ ...form, durationMinutes: Number(e.target.value) })
            }
          />
          <input
            className="input"
            type="number"
            placeholder="₺"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
          <button type="submit" className="btn-primary col-span-2 sm:col-span-4">
            Ekle
          </button>
        </form>
      )}

      <div className="card services-admin__table-wrap !p-0">
        <table className="services-admin__table w-full">
          <thead>
            <tr className="services-admin__display-row">
              <th colSpan={2} />
              <th className="services-admin__th services-admin__th--num">
                <label className="services-admin__display-toggle">
                  <input
                    type="checkbox"
                    checked={showDuration}
                    disabled={displaySaving}
                    onChange={(e) =>
                      toggleDisplay("showServiceDuration", e.target.checked)
                    }
                  />
                  <span>Tümü — süre</span>
                </label>
              </th>
              <th className="services-admin__th services-admin__th--num">
                <label className="services-admin__display-toggle">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    disabled={displaySaving}
                    onChange={(e) =>
                      toggleDisplay("showServicePrice", e.target.checked)
                    }
                  />
                  <span>Tümü — fiyat</span>
                </label>
              </th>
              <th className="services-admin__th services-admin__th--num">
                <span className="text-[10px] font-normal normal-case text-gray-500">
                  Hizmet bazlı
                </span>
              </th>
              <th />
            </tr>
            <tr>
              <th className="services-admin__th services-admin__th--img">Görsel</th>
              <th className="services-admin__th">Hizmet</th>
              <th className="services-admin__th services-admin__th--num">Süre</th>
              <th className="services-admin__th services-admin__th--num">Fiyat</th>
              <th className="services-admin__th services-admin__th--num">Fiyat göster</th>
              <th className="services-admin__th services-admin__th--actions">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((cat) => (
              <Fragment key={cat}>
                <tr className="services-admin__category-row bg-lotus-50">
                  <td
                    colSpan={6}
                    className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-lotus-800"
                  >
                    {getServiceCategoryLabel(cat)}
                    <span className="ml-2 font-normal normal-case text-gray-500">
                      ({grouped[cat].length} hizmet)
                    </span>
                  </td>
                </tr>
                {grouped[cat].map((s) => (
              <tr key={s.id} className="services-admin__row">
                <td className="services-admin__td services-admin__td--img">
                  <AdminServiceThumb
                    slug={s.slug}
                    imageUrl={s.imageUrl}
                    alt={s.name}
                  />
                </td>
                <td className="services-admin__td">
                  {edit?.id === s.id && edit.field === "name" ? (
                    <div className="services-admin__edit">
                      <input
                        className="input services-admin__edit-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(s);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className="services-admin__edit-actions">
                        <button
                          type="button"
                          className="services-admin__edit-save"
                          onClick={() => saveEdit(s)}
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          className="services-admin__edit-cancel"
                          onClick={cancelEdit}
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="services-admin__name">{s.name}</div>
                  )}
                  <div className="services-admin__meta">
                    <span className="services-admin__badge">
                      {SERVICE_CATEGORY_LABELS[s.category] ?? s.category}
                    </span>
                    {s.isFeatured && (
                      <span className="services-admin__badge services-admin__badge--featured">
                        Öne çıkan
                      </span>
                    )}
                    {!s.isActive && (
                      <span className="services-admin__badge services-admin__badge--inactive">
                        Pasif
                      </span>
                    )}
                  </div>
                </td>
                <td className="services-admin__td services-admin__td--num">
                  {edit?.id === s.id && edit.field === "durationMinutes" ? (
                    <div className="services-admin__edit services-admin__edit--center">
                      <input
                        className="input services-admin__edit-input services-admin__edit-input--num"
                        type="number"
                        min={1}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(s);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className="services-admin__edit-actions">
                        <button
                          type="button"
                          className="services-admin__edit-save"
                          onClick={() => saveEdit(s)}
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          className="services-admin__edit-cancel"
                          onClick={cancelEdit}
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="services-admin__stat">{s.durationMinutes}</span>
                      <span className="services-admin__stat-unit">dk</span>
                    </>
                  )}
                </td>
                <td className="services-admin__td services-admin__td--num">
                  {edit?.id === s.id && edit.field === "price" ? (
                    <div className="services-admin__edit services-admin__edit--center">
                      <input
                        className="input services-admin__edit-input services-admin__edit-input--num"
                        type="number"
                        min={1}
                        step={1}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(s);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className="services-admin__edit-actions">
                        <button
                          type="button"
                          className="services-admin__edit-save"
                          onClick={() => saveEdit(s)}
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          className="services-admin__edit-cancel"
                          onClick={cancelEdit}
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="services-admin__price">{formatPrice(s.price)}</span>
                  )}
                </td>
                <td className="services-admin__td services-admin__td--num">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="services-admin__display-toggle !justify-start">
                      <input
                        type="checkbox"
                        checked={s.showPricePublic}
                        disabled={!showPrice}
                        onChange={(e) =>
                          void patchService(s.id, {
                            showPricePublic: e.target.checked,
                          })
                        }
                      />
                      <span>Site</span>
                    </label>
                    <label
                      className="services-admin__display-toggle !justify-start"
                      title={
                        s.isFeatured
                          ? "Ana sayfa öne çıkan kartında"
                          : "Önce «Öne çıkar» ile ana sayfaya ekleyin"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={s.showPriceOnHomepage}
                        disabled={!showPrice || !s.isFeatured}
                        onChange={(e) =>
                          void patchService(s.id, {
                            showPriceOnHomepage: e.target.checked,
                          })
                        }
                      />
                      <span>Ana sayfa</span>
                    </label>
                  </div>
                </td>
                <td className="services-admin__td services-admin__td--actions">
                  <div className="services-admin__actions">
                    <button
                      type="button"
                      className="services-admin__btn services-admin__btn--edit"
                      onClick={() => startEdit(s, "name")}
                      disabled={edit !== null}
                      title="Hizmet adını düzenle"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      İsim düzenle
                    </button>
                    <button
                      type="button"
                      className="services-admin__btn services-admin__btn--edit"
                      onClick={() => startEdit(s, "durationMinutes")}
                      disabled={edit !== null}
                      title="Süreyi düzenle"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      Süre düzenle
                    </button>
                    <button
                      type="button"
                      className="services-admin__btn services-admin__btn--edit"
                      onClick={() => startEdit(s, "price")}
                      disabled={edit !== null}
                      title="Fiyatı düzenle"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                      </svg>
                      Fiyat düzenle
                    </button>
                    <label className="services-admin__btn services-admin__btn--upload">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      Görsel yükle
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadImage(s.id, s.slug, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className={
                        s.isFeatured
                          ? "services-admin__btn services-admin__btn--featured-on"
                          : "services-admin__btn services-admin__btn--featured"
                      }
                      onClick={() =>
                        void patchService(s.id, {
                          isFeatured: !s.isFeatured,
                        })
                      }
                      title={
                        s.isFeatured
                          ? "Öne çıkarmayı kaldır"
                          : "Ana sayfada öne çıkar"
                      }
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={s.isFeatured ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {s.isFeatured ? "Öne çıkan" : "Öne çıkar"}
                    </button>
                    <button
                      type="button"
                      className="services-admin__btn services-admin__btn--delete"
                      onClick={() => deleteService(s.id)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
