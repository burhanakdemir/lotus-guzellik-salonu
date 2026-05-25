"use client";

import { useCallback, useEffect, useState } from "react";
import { StaffServiceEditor } from "@/components/admin/StaffServiceEditor";
import { STAFF_PROFILE_COLORS } from "@/lib/staff-admin";
import { formatPhoneDisplay } from "@/lib/phone";

interface StaffRow {
  id: string;
  slug: string;
  label: string;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    phone: string;
    isActive: boolean;
  };
  _count: { appointments: number; services: number };
}

const emptyAdd = {
  name: "",
  label: "",
  phone: "",
  slug: "",
  password: "Staff123!",
};

export function StaffAdminPanel() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [maxActive, setMaxActive] = useState(5);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyAdd);
  const [editForm, setEditForm] = useState({
    name: "",
    label: "",
    phone: "",
    slug: "",
    password: "",
    color: STAFF_PROFILE_COLORS[0],
    sortOrder: 0,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || "Usta listesi yüklenemedi.", true);
        return;
      }
      setStaff(data.staff);
      setActiveCount(data.activeCount);
      setMaxActive(data.maxActive);
    } catch {
      flash("Bağlantı hatası.", true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function selectRow(row: StaffRow) {
    setSelected(row.id);
    setEditForm({
      name: row.user.name,
      label: row.label,
      phone: row.user.phone,
      slug: row.slug,
      password: "",
      color: row.color || STAFF_PROFILE_COLORS[0],
      sortOrder: row.sortOrder,
    });
  }

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error || "Usta eklenemedi.", true);
      return;
    }
    setAddForm(emptyAdd);
    setShowAdd(false);
    await load();
    flash("Usta eklendi.");
    selectRow(data);
  }

  async function saveStaff() {
    if (!selected) return;
    const body: Record<string, string | number | boolean> = {
      name: editForm.name.trim(),
      label: editForm.label.trim(),
      phone: editForm.phone.trim(),
      slug: editForm.slug.trim(),
      color: editForm.color,
      sortOrder: editForm.sortOrder,
    };
    if (editForm.password.trim().length >= 6) {
      body.password = editForm.password.trim();
    }
    const res = await fetch(`/api/admin/staff/${selected}`, {
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
    selectRow(data);
    flash("Usta güncellendi.");
  }

  async function toggleActive(row: StaffRow) {
    const res = await fetch(`/api/admin/staff/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error || "Durum güncellenemedi.", true);
      return;
    }
    await load();
    if (selected === row.id) selectRow(data);
    flash(row.isActive ? "Usta pasif yapıldı." : "Usta aktif yapıldı.");
  }

  async function deleteStaff(row: StaffRow) {
    const apptNote =
      row._count.appointments > 0
        ? ` ${row._count.appointments} randevudaki usta ataması kaldırılır.`
        : "";
    if (
      !confirm(
        `"${row.label}" kalıcı olarak silinsin mi?${apptNote}\n\nBu işlem geri alınamaz.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/staff/${row.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      flash((data as { error?: string }).error || "Usta silinemedi.", true);
      return;
    }
    if (selected === row.id) setSelected(null);
    await load();
    flash("Usta silindi.");
  }

  const selectedRow = staff.find((s) => s.id === selected);

  return (
    <div className="staff-admin space-y-2">
      {(message || error) && (
        <p
          className={`rounded px-2 py-1 text-[11px] ${
            error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] text-gray-600">
          Aktif: <strong>{activeCount}</strong> / {maxActive}
        </p>
        <button
          type="button"
          className="btn-primary ml-auto"
          disabled={activeCount >= maxActive}
          onClick={() => setShowAdd(!showAdd)}
          title={
            activeCount >= maxActive
              ? `En fazla ${maxActive} aktif usta`
              : undefined
          }
        >
          {showAdd ? "İptal" : "+ Yeni usta"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={createStaff} className="card grid gap-2 sm:grid-cols-2">
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
            <label className="label">Panel adı</label>
            <input
              className="input"
              value={addForm.label}
              onChange={(e) =>
                setAddForm({ ...addForm, label: e.target.value })
              }
              placeholder="Örn. Ayşe"
              required
            />
          </div>
          <div>
            <label className="label">Telefon (giriş)</label>
            <input
              className="input"
              type="tel"
              value={addForm.phone}
              onChange={(e) =>
                setAddForm({ ...addForm, phone: e.target.value })
              }
              placeholder="05XX XXX XX XX"
              required
            />
          </div>
          <div>
            <label className="label">URL slug</label>
            <input
              className="input"
              value={addForm.slug}
              onChange={(e) =>
                setAddForm({ ...addForm, slug: e.target.value })
              }
              placeholder="usta-1"
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
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Kaydet
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-[11px] text-gray-500">Yükleniyor…</p>
      ) : staff.length === 0 ? (
        <p className="text-[11px] text-gray-500">
          Henüz usta yok. MULTI_ADMIN_SEED_STAFF=true ile seed edebilir veya
          yukarıdan ekleyebilirsiniz.
        </p>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          <div className="card overflow-hidden p-0">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-2 py-1">Usta</th>
                  <th className="px-2 py-1">Telefon</th>
                  <th className="px-2 py-1">Randevu</th>
                  <th className="px-2 py-1">Hizmet</th>
                  <th className="px-2 py-1">Durum</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => (
                  <tr
                    key={row.id}
                    className={`cursor-pointer border-t border-gray-100 hover:bg-lotus-50 ${
                      selected === row.id ? "bg-lotus-50" : ""
                    }`}
                    onClick={() => selectRow(row)}
                  >
                    <td className="px-2 py-1">
                      <span
                        className="mr-1 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: row.color || "#ccc" }}
                      />
                      {row.label}
                    </td>
                    <td className="px-2 py-1">
                      {formatPhoneDisplay(row.user.phone)}
                    </td>
                    <td className="px-2 py-1">{row._count.appointments}</td>
                    <td className="px-2 py-1 text-gray-600">
                      {row._count.services === 0
                        ? "Tümü"
                        : `${row._count.services} adet`}
                    </td>
                    <td className="px-2 py-1">
                      {row.isActive ? (
                        <span className="text-green-700">Aktif</span>
                      ) : (
                        <span className="text-gray-400">Pasif</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRow && (
            <div className="card space-y-2">
              <h2 className="text-sm font-semibold text-lotus-800">
                {selectedRow.label}
              </h2>

              <StaffServiceEditor
                staffId={selectedRow.id}
                staffLabel={selectedRow.label}
              />

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
                  <label className="label">Panel adı</label>
                  <input
                    className="input"
                    value={editForm.label}
                    onChange={(e) =>
                      setEditForm({ ...editForm, label: e.target.value })
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
                <div>
                  <label className="label">Slug</label>
                  <input
                    className="input"
                    value={editForm.slug}
                    onChange={(e) =>
                      setEditForm({ ...editForm, slug: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Renk</label>
                  <div className="flex flex-wrap gap-1">
                    {STAFF_PROFILE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`h-6 w-6 rounded border-2 ${
                          editForm.color === c
                            ? "border-lotus-700"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => setEditForm({ ...editForm, color: c })}
                        aria-label={`Renk ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Sıra</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={99}
                    value={editForm.sortOrder}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        sortOrder: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Yeni şifre (boş bırak = değişmez)</label>
                  <input
                    className="input"
                    type="text"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                    placeholder="En az 6 karakter"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <button type="button" className="btn-primary" onClick={saveStaff}>
                  Kaydet
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => toggleActive(selectedRow)}
                >
                  {selectedRow.isActive ? "Pasif yap" : "Aktif yap"}
                </button>
                <button
                  type="button"
                  className="text-[11px] text-red-600 hover:underline"
                  onClick={() => deleteStaff(selectedRow)}
                >
                  Ustayı sil
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
