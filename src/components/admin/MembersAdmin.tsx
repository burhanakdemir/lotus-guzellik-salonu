"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_MEMBER_PASSWORD } from "@/lib/member-constants";
import { formatPhoneDisplay, formatPrice } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
}

interface MemberDetail {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  appointments: {
    date: string;
    startTime: string;
    service: { name: string };
  }[];
  discounts: {
    id: string;
    title: string;
    discountType: string;
    discountValue: number;
    isActive: boolean;
  }[];
}

export function MembersAdmin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    password: DEFAULT_MEMBER_PASSWORD,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    password: "",
  });
  const [discountForm, setDiscountForm] = useState({
    title: "İndirim",
    discountType: "PERCENT" as "PERCENT" | "FIXED",
    discountValue: 10,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    allServices: true,
    singleUse: false,
  });

  const flash = useCallback((text: string, isError = false) => {
    if (isError) {
      setError(text);
      setMessage("");
    } else {
      setMessage(text);
      setError("");
    }
    setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
  }, []);

  async function load(search = q) {
    const res = await fetch(
      `/api/admin/members?q=${encodeURIComponent(search)}`
    );
    if (!res.ok) {
      flash("Üyeler yüklenemedi.", true);
      return;
    }
    setMembers(await res.json());
  }

  useEffect(() => {
    load("");
  }, []);

  function closeDetail() {
    setSelected(null);
    setDetail(null);
    setDetailLoading(false);
    setConfirmDelete(false);
  }

  async function openDetail(id: string) {
    setSelected(id);
    setDetail(null);
    setDetailLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/members/${id}`);
      if (!res.ok) {
        flash("Üye detayı alınamadı.", true);
        closeDetail();
        return;
      }
      const data = (await res.json()) as MemberDetail;
      setDetail(data);
      setEditForm({ name: data.name, phone: data.phone, password: "" });
    } catch {
      flash("Bağlantı hatası.", true);
      closeDetail();
    } finally {
      setDetailLoading(false);
    }
  }

  async function createMember(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error || "Üye eklenemedi.", true);
      return;
    }
    setAddForm({ name: "", phone: "", password: DEFAULT_MEMBER_PASSWORD });
    setShowAdd(false);
    await load();
    flash("Üye eklendi.");
    openDetail(data.id);
  }

  async function saveMember() {
    if (!selected) return;
    const body: Record<string, string | boolean> = {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
    };
    if (editForm.password.trim().length >= 6) {
      body.password = editForm.password.trim();
    }
    const res = await fetch(`/api/admin/members/${selected}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error || "Kaydedilemedi.", true);
      return;
    }
    setEditForm((f) => ({ ...f, password: "" }));
    await load();
    await openDetail(selected);
    flash("Üye bilgileri güncellendi.");
  }

  async function toggleActive() {
    if (!selected || !detail) return;
    const res = await fetch(`/api/admin/members/${selected}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !detail.isActive }),
    });
    if (!res.ok) {
      flash("Durum güncellenemedi.", true);
      return;
    }
    await load();
    await openDetail(selected);
    flash(detail.isActive ? "Üye pasif yapıldı." : "Üye aktif yapıldı.");
  }

  async function deleteMember() {
    if (!selected || !detail || !confirmDelete) return;
    const res = await fetch(`/api/admin/members/${selected}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      flash((data as { error?: string }).error || "Silinemedi.", true);
      return;
    }
    closeDetail();
    await load();
    flash("Üye silindi.");
  }

  async function addDiscount(userId: string) {
    const res = await fetch(`/api/admin/members/${userId}/discounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discountForm),
    });
    if (!res.ok) {
      flash("İndirim eklenemedi.", true);
      return;
    }
    await openDetail(userId);
    flash("İndirim tanımlandı.");
  }

  return (
    <div className="members-admin space-y-2">
      {(message || error) && (
        <p
          className={`rounded px-2 py-1 text-[11px] ${
            error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        <input
          className="input min-w-[10rem] flex-1"
          placeholder="Ad veya telefon ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button type="button" className="btn-secondary" onClick={() => load()}>
          Ara
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? "İptal" : "+ Yeni üye"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={createMember} className="card grid gap-2 sm:grid-cols-2">
          <div>
            <label className="label">Ad Soyad</label>
            <input
              className="input"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input
              className="input"
              type="tel"
              value={addForm.phone}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              placeholder="05XX XXX XX XX"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Şifre</label>
            <input
              className="input"
              type="text"
              value={addForm.password}
              onChange={(e) =>
                setAddForm({ ...addForm, password: e.target.value })
              }
              minLength={6}
              required
            />
            <p className="mt-0.5 text-[10px] text-gray-500">
              Varsayılan: {DEFAULT_MEMBER_PASSWORD}
            </p>
          </div>
          <button type="submit" className="btn-primary sm:col-span-2">
            Üye kaydet
          </button>
        </form>
      )}

      <div className="card members-admin__list !p-0">
        <table className="members-admin__table w-full">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Telefon</th>
              <th className="text-right">Durum</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-gray-500">
                  Üye bulunamadı.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr
                  key={m.id}
                  className={
                    selected === m.id
                      ? "members-admin__row members-admin__row--selected"
                      : "members-admin__row"
                  }
                  onClick={() => openDetail(m.id)}
                >
                  <td className="font-medium">{m.name}</td>
                  <td className="text-gray-600">
                    {formatPhoneDisplay(m.phone)}
                  </td>
                  <td className="text-right">
                    <span
                      className={
                        m.isActive
                          ? "members-admin__status members-admin__status--on"
                          : "members-admin__status members-admin__status--off"
                      }
                    >
                      {m.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="members-admin__modal-backdrop"
          role="presentation"
          onClick={closeDetail}
        >
          <div
            className="card members-admin__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !detail ? (
              <p className="py-8 text-center text-[11px] text-gray-500">
                Yükleniyor…
              </p>
            ) : (
              <div className="members-admin__detail space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2
                      id="member-modal-title"
                      className="!normal-case !tracking-normal"
                    >
                      {detail.name}
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      {formatPhoneDisplay(detail.phone)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {!confirmDelete ? (
                      <>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={toggleActive}
                        >
                          {detail.isActive ? "Pasif yap" : "Aktif yap"}
                        </button>
                        <button
                          type="button"
                          className="services-admin__btn services-admin__btn--delete"
                          onClick={() => setConfirmDelete(true)}
                        >
                          Sil
                        </button>
                      </>
                    ) : (
                      <div className="members-admin__delete-confirm">
                        <p className="members-admin__delete-confirm-text">
                          <strong>{detail.name}</strong> silinsin mi?
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setConfirmDelete(false)}
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            className="services-admin__btn services-admin__btn--delete"
                            onClick={deleteMember}
                          >
                            Evet, sil
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="members-admin__modal-close"
                      onClick={closeDetail}
                      aria-label="Kapat"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {confirmDelete && (
                  <p className="text-[10px] text-red-700">
                    Randevu kayıtları kalır; üyelik ve indirimler kalıcı olarak
                    kaldırılır.
                  </p>
                )}

                <fieldset className="members-admin__section">
              <legend className="label">Bilgiler & şifre</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="label">Ad Soyad</label>
                  <input
                    className="input"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Telefon</label>
                  <input
                    className="input"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Yeni şifre</label>
                  <input
                    className="input"
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                    placeholder="Değiştirmek için en az 6 karakter"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn-primary mt-2"
                onClick={saveMember}
              >
                Kaydet
              </button>
            </fieldset>

            <fieldset className="members-admin__section">
              <legend className="label">Son randevular</legend>
              {detail.appointments?.length === 0 ? (
                <p className="text-[10px] text-gray-500">Randevu yok.</p>
              ) : (
                <ul className="space-y-0.5">
                  {detail.appointments.slice(0, 5).map((a, i) => (
                    <li key={i} className="text-[10px] text-gray-600">
                      {a.date} {a.startTime} — {a.service.name}
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <fieldset className="members-admin__section border-t border-gray-100 pt-2">
              <legend className="label">Üyeye özel indirim</legend>
              {detail.discounts?.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {detail.discounts.map((d) => (
                    <li
                      key={d.id}
                      className="rounded bg-lotus-50 px-2 py-1 text-[10px] text-lotus-900"
                    >
                      <span className="font-medium">{d.title}</span> —{" "}
                      {d.discountType === "PERCENT"
                        ? `%${d.discountValue}`
                        : formatPrice(d.discountValue)}
                      {!d.isActive && (
                        <span className="text-gray-500"> (pasif)</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="label">Başlık</label>
                  <input
                    className="input"
                    value={discountForm.title}
                    onChange={(e) =>
                      setDiscountForm({ ...discountForm, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Tür / değer</label>
                  <div className="flex gap-1">
                    <select
                      className="input"
                      value={discountForm.discountType}
                      onChange={(e) =>
                        setDiscountForm({
                          ...discountForm,
                          discountType: e.target.value as "PERCENT" | "FIXED",
                        })
                      }
                    >
                      <option value="PERCENT">%</option>
                      <option value="FIXED">₺</option>
                    </select>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={discountForm.discountValue}
                      onChange={(e) =>
                        setDiscountForm({
                          ...discountForm,
                          discountValue: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Başlangıç</label>
                  <input
                    className="input"
                    type="date"
                    value={discountForm.startDate}
                    onChange={(e) =>
                      setDiscountForm({
                        ...discountForm,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">Bitiş</label>
                  <input
                    className="input"
                    type="date"
                    value={discountForm.endDate}
                    onChange={(e) =>
                      setDiscountForm({
                        ...discountForm,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <label className="mt-1 flex items-center gap-1 text-[10px]">
                <input
                  type="checkbox"
                  checked={discountForm.singleUse}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      singleUse: e.target.checked,
                    })
                  }
                />
                Tek kullanımlık
              </label>
              <button
                type="button"
                className="btn-primary mt-2 w-full"
                onClick={() => addDiscount(selected)}
              >
                İndirim tanımla
              </button>
            </fieldset>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
