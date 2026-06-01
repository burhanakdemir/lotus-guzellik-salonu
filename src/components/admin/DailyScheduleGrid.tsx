"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import type { AdminServiceOption } from "@/components/admin/AppointmentsAdmin";
import { getAppointmentMemberDisplayName } from "@/lib/admin-appointment-line";
import { slotStartIsBlocked } from "@/lib/blocked-slots";
import {
  minutesToTime,
  normalizeTimeHHmm,
  timeToMinutes,
} from "@/lib/time-format";

export const statusChip: Record<string, string> = {
  PENDING: "apt-chip apt-chip--pending",
  CONFIRMED: "apt-chip apt-chip--confirmed",
  CANCELLED: "apt-chip apt-chip--cancelled",
  COMPLETED: "apt-chip apt-chip--completed",
};

export const statusDayEvent: Record<string, string> = {
  PENDING: "apt-calendar__day-event apt-day-event--pending",
  CONFIRMED: "apt-calendar__day-event apt-day-event--confirmed",
  CANCELLED: "apt-calendar__day-event apt-day-event--cancelled",
  COMPLETED: "apt-calendar__day-event apt-day-event--completed",
};

import type { SalonDaySchedule } from "@/lib/salon-schedule";

function aptOccupiesSlot(apt: CalendarAppointment, slotTime: string): boolean {
  const slotMin = timeToMinutes(slotTime);
  const startMin = timeToMinutes(normalizeTimeHHmm(apt.startTime));
  const endMin = timeToMinutes(normalizeTimeHHmm(apt.endTime));
  return slotMin >= startMin && slotMin < endMin;
}

function aptStartsAtSlot(apt: CalendarAppointment, slotTime: string): boolean {
  return normalizeTimeHHmm(apt.startTime) === normalizeTimeHHmm(slotTime);
}

export function DailyScheduleGrid({
  cursor,
  dateKey,
  appointments,
  services,
  canCreate,
  canEdit,
  highlightStaffProfileId,
  onSelect,
  onSlotClick,
  onUnblockSlot,
  scheduleStaffId,
  scheduleRefreshKey = 0,
  initialSchedule = null,
}: {
  cursor: Date;
  dateKey: string;
  appointments: CalendarAppointment[];
  services: AdminServiceOption[];
  canCreate: boolean;
  canEdit: (apt: CalendarAppointment) => boolean;
  highlightStaffProfileId?: string;
  onSelect: (a: CalendarAppointment) => void;
  onSlotClick: (startTime: string) => void;
  onUnblockSlot?: (blockId: string) => void | Promise<void>;
  scheduleStaffId?: string | null;
  scheduleRefreshKey?: number;
  initialSchedule?: SalonDaySchedule | null;
}) {
  const [schedule, setSchedule] = useState<SalonDaySchedule | null>(
    initialSchedule?.date === dateKey ? initialSchedule : null
  );
  const [scheduleLoading, setScheduleLoading] = useState(
    !initialSchedule || initialSchedule.date !== dateKey
  );
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    if (
      scheduleRefreshKey === 0 &&
      initialSchedule?.date === dateKey
    ) {
      setSchedule(initialSchedule);
      setScheduleLoading(false);
      setScheduleError(null);
      return;
    }

    let cancelled = false;
    setScheduleLoading(true);
    setScheduleError(null);

    const staffQ =
      scheduleStaffId != null && scheduleStaffId !== ""
        ? `&staffId=${encodeURIComponent(scheduleStaffId)}`
        : "";
    fetch(`/api/admin/appointments/schedule?date=${dateKey}${staffQ}`)
      .then(async (r) => {
        const data = (await r.json()) as SalonDaySchedule & { error?: string };
        if (cancelled) return;
        if (!r.ok || data.error) {
          setSchedule(null);
          setScheduleError(data.error || "Çalışma saatleri yüklenemedi.");
          return;
        }
        setSchedule(data);
      })
      .catch(() => {
        if (!cancelled) {
          setSchedule(null);
          setScheduleError("Bağlantı hatası.");
        }
      })
      .finally(() => {
        if (!cancelled) setScheduleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateKey, initialSchedule, scheduleStaffId, scheduleRefreshKey]);

  const activeAppointments = appointments.filter((a) => a.status !== "CANCELLED");
  const dayShort = format(cursor, "EEE", { locale: tr });
  const slotSet = new Set(schedule?.slots ?? []);
  const orphanAppointments = activeAppointments.filter(
    (a) => !slotSet.has(normalizeTimeHHmm(a.startTime))
  );

  return (
    <div className="apt-calendar__day-panel space-y-2">
      {schedule?.markedClosed && (
        <p className="rounded bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
          İşaretli kapalı gün
          {schedule.closedReason ? `: ${schedule.closedReason}` : ""} — yine de randevu
          eklenebilir.
        </p>
      )}

      {scheduleLoading ? (
        <div className="py-6 text-center text-gray-500">Saatler yükleniyor…</div>
      ) : scheduleError ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-4 text-center text-[11px] text-red-700">
          {scheduleError}
        </div>
      ) : !schedule || schedule.closed ? (
        <div className="rounded border border-gray-200 bg-gray-50 px-3 py-4 text-center text-[11px] text-gray-500">
          {schedule?.reason || "Bu gün için çalışma saati yok."}
        </div>
      ) : (
        <div className="rounded border border-lotus-200 bg-white px-3 py-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-gray-700">
              {dayShort} · {format(cursor, "d MMMM yyyy", { locale: tr })}
            </span>
            <span className="text-[10px] text-gray-500">
              {schedule.open} – {schedule.close} · {schedule.slotInterval} dk
            </span>
          </div>
          <p className="mt-1 text-[10px] text-gray-500">
            {activeAppointments.length} randevu —{" "}
            {canCreate
              ? "boş saate tıklayın — randevu ekleyin veya saati kapatın"
              : "boş saatlere tıklayarak görüntüleyin"}
          </p>
          <div className="apt-calendar__slot-grid mt-2">
            {schedule.slots.map((slotTime) => {
              const slotEnd = minutesToTime(
                timeToMinutes(slotTime) + schedule.slotInterval
              );
              const starting = activeAppointments.find((a) =>
                aptStartsAtSlot(a, slotTime)
              );
              const occupied = activeAppointments.some((a) =>
                aptOccupiesSlot(a, slotTime)
              );
              const block = !occupied
                ? slotStartIsBlocked(
                    slotTime,
                    slotEnd,
                    schedule.blockedSlots ?? []
                  )
                : undefined;
              const isFree = !occupied && !block;

              if (starting) {
                const chip =
                  statusChip[starting.status]?.replace("apt-chip ", "") ?? "";
                const isMine =
                  highlightStaffProfileId &&
                  starting.assignedStaffId === highlightStaffProfileId;
                const readOnly = !canEdit(starting);
                const label = getAppointmentMemberDisplayName(starting);
                return (
                  <button
                    key={slotTime}
                    type="button"
                    className={`apt-calendar__slot-chip apt-calendar__slot-chip--booked ${chip} ${isMine ? "ring-2 ring-lotus-500 ring-offset-1" : ""}`}
                    onClick={() => onSelect(starting)}
                    title={
                      readOnly
                        ? `${label} — salt okunur`
                        : `${label} — ${starting.service.name}`
                    }
                  >
                    <span className="apt-calendar__slot-chip-time">{slotTime}</span>
                    <span className="apt-calendar__slot-chip-name truncate">
                      {label}
                    </span>
                  </button>
                );
              }

              if (block) {
                return (
                  <button
                    key={slotTime}
                    type="button"
                    className="apt-calendar__slot-chip apt-calendar__slot-chip--blocked"
                    onClick={() =>
                      canCreate && onUnblockSlot?.(block.id)
                    }
                    disabled={!canCreate || !onUnblockSlot}
                    title={
                      canCreate
                        ? "Kapalı — tekrar açmak için tıklayın"
                        : "Bu saat kapalı"
                    }
                  >
                    <span className="apt-calendar__slot-chip-time">{slotTime}</span>
                    <span className="apt-calendar__slot-chip-name">Kapalı</span>
                  </button>
                );
              }

              if (isFree) {
                return (
                  <button
                    key={slotTime}
                    type="button"
                    className="apt-calendar__slot-chip apt-calendar__slot-chip--free"
                    onClick={() => canCreate && onSlotClick(slotTime)}
                    disabled={!canCreate}
                    title={
                      canCreate
                        ? "Randevu ekle veya saati kapat"
                        : "Randevu ekleme yetkisi yok"
                    }
                  >
                    {slotTime}
                  </button>
                );
              }

              return (
                <span
                  key={slotTime}
                  className="apt-calendar__slot-chip apt-calendar__slot-chip--occupied"
                  title="Randevu — dolu"
                  aria-label={`${slotTime} dolu`}
                >
                  <span className="apt-calendar__slot-chip-time">{slotTime}</span>
                  <span className="apt-calendar__slot-chip-name">Dolu</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {orphanAppointments.length > 0 && (
        <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="mb-1 text-[10px] font-medium text-gray-600">
            Çalışma saatleri dışı / özel saat
          </p>
          <ul className="space-y-1">
            {orphanAppointments.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className={`${statusDayEvent[a.status] ?? "apt-calendar__day-event"} w-full rounded px-2 py-1 text-left text-[11px]`}
                  onClick={() => onSelect(a)}
                >
                  {a.startTime}–{a.endTime}{" "}
                  {getAppointmentMemberDisplayName(a)} · {a.service.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
