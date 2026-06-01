"use client";

import { useEffect, useState } from "react";
import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import type { AdminServiceOption } from "@/components/admin/AppointmentsAdmin";
import { bookingBlockMinutes } from "@/lib/appointment-booking-duration";
import { minutesToTime, timeToMinutes } from "@/lib/time-format";

export function EditAppointmentModal({
  apt,
  services,
  showServiceDuration,
  slotInterval,
  onClose,
  onSaved,
}: {
  apt: CalendarAppointment;
  services: AdminServiceOption[];
  showServiceDuration: boolean;
  slotInterval: number;
  onClose: () => void;
  onSaved: (updated: CalendarAppointment) => void;
}) {
  const [date, setDate] = useState(apt.date);
  const [serviceId, setServiceId] = useState(
    apt.service.id ?? services.find((s) => s.name === apt.service.name)?.id ?? services[0]?.id ?? ""
  );
  const [startTime, setStartTime] = useState(apt.startTime);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedService = services.find((s) => s.id === serviceId);
  const endPreview = selectedService
    ? minutesToTime(
        timeToMinutes(startTime) +
          bookingBlockMinutes(
            { showServiceDuration, slotInterval },
            selectedService
          )
      )
    : apt.endTime;

  useEffect(() => {
    if (!serviceId || !date) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError("");

    const params = new URLSearchParams({
      date,
      serviceId,
      excludeAppointmentId: apt.id,
    });
    if (apt.assignedStaffId) {
      params.set("assignedStaffId", apt.assignedStaffId);
    }

    fetch(`/api/admin/appointments/slots?${params}`)
      .then((r) => r.json())
      .then((data: { slots?: string[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setSlots([]);
          setSlotsError(data.error);
          return;
        }
        const list = data.slots ?? [];
        setSlots(list);
        setStartTime((prev) =>
          list.includes(prev) ? prev : list[0] ?? prev
        );
      })
      .catch(() => {
        if (!cancelled) setSlotsError("Saatler yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date, serviceId, apt.id, apt.assignedStaffId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!serviceId || !startTime) {
      setError("Hizmet ve saat seçin.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/appointments/${apt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime, serviceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Güncellenemedi.");
        return;
      }
      onSaved(data as CalendarAppointment);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="apt-calendar__modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <form
        className="card apt-calendar__modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 className="font-semibold text-lotus-800">Randevuyu düzenle</h3>
        <p className="text-[11px] text-gray-600">
          Tarih ve saati değiştirebilirsiniz.
        </p>

        {error && (
          <p className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-700">
            {error}
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="label">Tarih</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Hizmet</label>
            <select
              className="input"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes} dk)
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Başlangıç saati</label>
            {slotsLoading ? (
              <p className="text-[11px] text-gray-500">Saatler yükleniyor…</p>
            ) : slotsError ? (
              <p className="text-[11px] text-red-600">{slotsError}</p>
            ) : slots.length === 0 ? (
              <p className="text-[11px] text-amber-700">
                Bu gün için uygun saat yok.
              </p>
            ) : (
              <select
                className="input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              >
                {slots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
            {selectedService && startTime && (
              <p className="mt-0.5 text-[10px] text-gray-500">
                Bitiş: {endPreview}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            İptal
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || slots.length === 0}
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
