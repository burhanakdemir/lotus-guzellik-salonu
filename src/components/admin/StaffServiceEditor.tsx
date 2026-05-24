"use client";

import { useCallback, useEffect, useState } from "react";

type ServiceOption = { id: string; name: string; category: string };

export function StaffServiceEditor({
  staffId,
  staffLabel,
}: {
  staffId: string;
  staffLabel: string;
}) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allAllowed, setAllAllowed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/services`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hizmetler yüklenemedi.");
        return;
      }
      setServices(data.services ?? []);
      setAllAllowed(data.allServicesAllowed === true);
      setSelected(new Set((data.serviceIds as string[]) ?? []));
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleService(id: string) {
    setAllAllowed(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setAllAllowed(false);
    setSelected(new Set(services.map((s) => s.id)));
  }

  function clearAll() {
    setAllAllowed(true);
    setSelected(new Set());
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/services`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceIds: allAllowed ? [] : [...selected],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi.");
        return;
      }
      setAllAllowed(data.allServicesAllowed === true);
      setSelected(new Set(data.serviceIds ?? []));
      setMessage("Hizmet yetkileri kaydedildi.");
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setError("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  const byCategory = services.reduce<Record<string, ServiceOption[]>>((acc, s) => {
    const cat = s.category || "Diğer";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="rounded border border-lotus-200 bg-lotus-50/40 p-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-lotus-800">
          Yapabildiği hizmetler — {staffLabel}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            className="text-[10px] text-lotus-700 hover:underline"
            onClick={selectAll}
          >
            Tümünü seç
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            className="text-[10px] text-lotus-700 hover:underline"
            onClick={clearAll}
          >
            Tüm hizmetler (kısıtsız)
          </button>
        </div>
      </div>

      {allAllowed && (
        <p className="mb-2 text-[10px] text-gray-600">
          Şu an <strong>tüm hizmetleri</strong> yapabilir. Belirli hizmet seçmek için
          aşağıdan işaretleyin.
        </p>
      )}
      {!allAllowed && selected.size === 0 && (
        <p className="mb-2 text-[10px] text-amber-700">
          Hiç hizmet seçilmedi — online randevuda görünmez.
        </p>
      )}

      {message && (
        <p className="mb-2 text-[10px] text-green-700">{message}</p>
      )}
      {error && <p className="mb-2 text-[10px] text-red-700">{error}</p>}

      {loading ? (
        <p className="text-[10px] text-gray-500">Hizmetler yükleniyor…</p>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] font-medium text-gray-500">{cat}</p>
              <ul className="mt-0.5 space-y-0.5">
                {items.map((s) => (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-center gap-2 text-[11px]">
                      <input
                        type="checkbox"
                        checked={!allAllowed && selected.has(s.id)}
                        onChange={() => toggleService(s.id)}
                      />
                      <span>{s.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn-primary mt-2 !py-1 !text-[11px]"
        disabled={saving || loading}
        onClick={save}
      >
        {saving ? "Kaydediliyor…" : "Hizmet yetkilerini kaydet"}
      </button>
    </div>
  );
}
