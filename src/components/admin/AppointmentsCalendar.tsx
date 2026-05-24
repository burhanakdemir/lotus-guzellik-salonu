"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isSameMonth } from "date-fns";
import { tr } from "date-fns/locale";
import {
  type CalendarView,
  formatCalendarTitle,
  getMonthGridDays,
  getViewRange,
  getWeekDays,
  navigateCursor,
  parseDateKey,
  toDateKey,
  WEEKDAY_LABELS,
} from "@/lib/calendar-dates";
import { todayString } from "@/lib/timezone";
import { formatPhoneDisplay, minutesToTime, timeToMinutes } from "@/lib/utils";
import { canEditAppointment } from "@/lib/admin-permissions";
import type { AdminServiceOption } from "@/components/admin/AppointmentsAdmin";

export interface CalendarAppointment {
  id: string;
  name: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  assignedStaffId?: string | null;
  assignedStaff?: {
    id: string;
    slug: string;
    label: string;
    color: string | null;
  } | null;
  service: { name: string };
}

const statuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
const statusLabels: Record<string, string> = {
  PENDING: "Beklemede",
  CONFIRMED: "Onaylandı",
  CANCELLED: "İptal",
  COMPLETED: "Tamamlandı",
};

const statusChip: Record<string, string> = {
  PENDING: "apt-chip apt-chip--pending",
  CONFIRMED: "apt-chip apt-chip--confirmed",
  CANCELLED: "apt-chip apt-chip--cancelled",
  COMPLETED: "apt-chip apt-chip--completed",
};

const statusDayEvent: Record<string, string> = {
  PENDING: "apt-calendar__day-event apt-day-event--pending",
  CONFIRMED: "apt-calendar__day-event apt-day-event--confirmed",
  CANCELLED: "apt-calendar__day-event apt-day-event--cancelled",
  COMPLETED: "apt-calendar__day-event apt-day-event--completed",
};

export type { CalendarView } from "@/lib/calendar-dates";

const VIEW_OPTIONS: { id: CalendarView; label: string }[] = [
  { id: "month", label: "Aylık" },
  { id: "week", label: "Haftalık" },
  { id: "day", label: "Günlük" },
];

function groupByDate(appointments: CalendarAppointment[]) {
  const map = new Map<string, CalendarAppointment[]>();
  for (const a of appointments) {
    const list = map.get(a.date) ?? [];
    list.push(a);
    map.set(a.date, list);
  }
  for (const list of map.values()) {
    list.sort((x, y) => x.startTime.localeCompare(y.startTime));
  }
  return map;
}

interface DaySchedule {
  date: string;
  closed: boolean;
  reason?: string;
  open?: string;
  close?: string;
  slotInterval: number;
  slots: string[];
  markedClosed?: boolean;
  closedReason?: string | null;
}

export function AppointmentsCalendar({
  initialAppointments,
  initialCursor = todayString(),
  services,
  isSuperAdmin = true,
  currentStaffProfileId = null,
  multiAdminEnabled = false,
  highlightStaffProfileId,
  filterStaffProfileId = null,
  assignStaffIdForCreate = null,
  defaultView = "month",
  pinnedDailyPanel = false,
}: {
  initialAppointments: CalendarAppointment[];
  initialCursor?: string;
  services: AdminServiceOption[];
  isSuperAdmin?: boolean;
  currentStaffProfileId?: string | null;
  multiAdminEnabled?: boolean;
  highlightStaffProfileId?: string;
  filterStaffProfileId?: string | null;
  assignStaffIdForCreate?: string | null;
  defaultView?: CalendarView;
  pinnedDailyPanel?: boolean;
}) {
  const [view, setView] = useState<CalendarView>(defaultView);
  const [cursor, setCursor] = useState(() => parseDateKey(initialCursor));
  const [appointments, setAppointments] = useState(initialAppointments);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [createSlot, setCreateSlot] = useState<{
    date: string;
    startTime: string;
  } | null>(null);

  const actor = {
    role: (isSuperAdmin ? "ADMIN" : "STAFF_ADMIN") as "ADMIN" | "STAFF_ADMIN",
    staffProfileId: currentStaffProfileId,
  };

  function canEdit(apt: CalendarAppointment): boolean {
    if (!multiAdminEnabled || isSuperAdmin) return true;
    return canEditAppointment(actor, {
      assignedStaffId: apt.assignedStaffId ?? null,
    });
  }

  const canCreate =
    isSuperAdmin ||
    (multiAdminEnabled &&
      !!currentStaffProfileId &&
      (!filterStaffProfileId ||
        filterStaffProfileId === currentStaffProfileId));

  const range = useMemo(() => getViewRange(view, cursor), [view, cursor]);

  const visibleAppointments = useMemo(() => {
    if (!filterStaffProfileId) return appointments;
    return appointments.filter(
      (a) => a.assignedStaffId === filterStaffProfileId
    );
  }, [appointments, filterStaffProfileId]);

  const byDate = useMemo(
    () => groupByDate(visibleAppointments),
    [visibleAppointments]
  );

  const loadRange = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/appointments?from=${from}&to=${to}`
      );
      if (res.ok) setAppointments(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRange(range.from, range.to);
  }, [range.from, range.to, loadRange]);

  async function updateStatus(id: string, status: string) {
    if (statusSaving) return;
    const apt =
      appointments.find((a) => a.id === id) ??
      visibleAppointments.find((a) => a.id === id);
    if (apt && !canEdit(apt)) {
      setStatusError("Bu randevuyu düzenleme yetkiniz yok.");
      return;
    }
    setStatusError("");
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusError(
          (data as { error?: string }).error || "Durum güncellenemedi."
        );
        return;
      }
      const updated = data as CalendarAppointment;
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, ...updated, service: a.service } : a
        )
      );
    } catch {
      setStatusError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setStatusSaving(false);
    }
  }

  function goToday() {
    setCursor(parseDateKey(todayString()));
  }

  function goPrev() {
    setCursor((c) => navigateCursor(view, c, -1));
  }

  function goNext() {
    setCursor((c) => navigateCursor(view, c, 1));
  }

  function openDay(dateKey: string) {
    setCursor(parseDateKey(dateKey));
    setView("day");
  }

  async function createAppointment(payload: {
    name: string;
    phone: string;
    serviceId: string;
    date: string;
    startTime: string;
    note?: string;
    userId?: string;
  }) {
    const postBody: Record<string, unknown> = { ...payload, status: "CONFIRMED" };
    if (assignStaffIdForCreate) {
      postBody.assignedStaffId = assignStaffIdForCreate;
    }
    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postBody),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (data as { error?: string }).error || "Randevu eklenemedi."
      );
    }
    const result = data as {
      appointment?: CalendarAppointment;
      memberCreated?: boolean;
    };
    const apt = result.appointment ?? (data as CalendarAppointment);
    setAppointments((prev) => {
      const next = [...prev, apt];
      next.sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      );
      return next;
    });
    setSelectedId(apt.id);
    if (result.memberCreated) {
      setTimeout(() => setCreateSlot(null), 2800);
    } else {
      setCreateSlot(null);
    }
    return { memberCreated: result.memberCreated };
  }

  const selected = visibleAppointments.find((a) => a.id === selectedId) ?? null;
  const dayKey = toDateKey(cursor);

  function handleSelect(apt: CalendarAppointment) {
    setCreateSlot(null);
    setSelectedId(apt.id);
  }

  function handleSlotClick(startTime: string) {
    if (!canCreate) return;
    setSelectedId(null);
    setCreateSlot({ date: dayKey, startTime });
  }

  return (
    <div className="apt-calendar space-y-2">
      {pinnedDailyPanel && (
        <div className="card space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="!mb-0 text-sm font-semibold text-lotus-800">
              Günlük randevular
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn-secondary !px-2 !py-0.5 !text-[10px]"
                onClick={() => setCursor((c) => navigateCursor("day", c, -1))}
              >
                ‹ Gün
              </button>
              <button
                type="button"
                className="btn-secondary !px-2 !py-0.5 !text-[10px]"
                onClick={goToday}
              >
                Bugün
              </button>
              <button
                type="button"
                className="btn-secondary !px-2 !py-0.5 !text-[10px]"
                onClick={() => setCursor((c) => navigateCursor("day", c, 1))}
              >
                Gün ›
              </button>
            </div>
          </div>
          {canCreate && multiAdminEnabled && !isSuperAdmin && (
            <p className="text-[10px] text-gray-600">
              Boş saate tıklayarak randevu ekleyin. Size atanan randevularda
              &quot;Randevuyu iptal et&quot; ile çıkarabilirsiniz; başkasına
              atanmış randevular salt okunurdur.
            </p>
          )}
          <DailyScheduleGrid
            cursor={cursor}
            dateKey={dayKey}
            appointments={byDate.get(dayKey) ?? []}
            services={services}
            canCreate={canCreate}
            canEdit={canEdit}
            highlightStaffProfileId={highlightStaffProfileId}
            onSelect={handleSelect}
            onSlotClick={handleSlotClick}
          />
        </div>
      )}

      <div className="apt-calendar__toolbar">
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" className="btn-secondary" onClick={goPrev}>
            ‹
          </button>
          <button type="button" className="btn-secondary" onClick={goNext}>
            ›
          </button>
          <button type="button" className="btn-secondary" onClick={goToday}>
            Bugün
          </button>
          <h2 className="!mb-0 !mt-0 min-w-[10rem] capitalize">
            {formatCalendarTitle(view, cursor)}
            {loading && (
              <span className="ml-1 font-normal text-gray-400">…</span>
            )}
          </h2>
        </div>
        <div className="apt-calendar__views" role="tablist">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={view === opt.id}
              className={
                view === opt.id
                  ? "apt-calendar__view-btn apt-calendar__view-btn--active"
                  : "apt-calendar__view-btn"
              }
              onClick={() => setView(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && (
        <MonthView
          cursor={cursor}
          byDate={byDate}
          onSelect={(a) => setSelectedId(a.id)}
          onDayClick={openDay}
        />
      )}
      {view === "week" && (
        <WeekView
          cursor={cursor}
          byDate={byDate}
          onSelect={(a) => setSelectedId(a.id)}
          onDayClick={openDay}
        />
      )}
      {view === "day" && !pinnedDailyPanel && (
        <DayView
          cursor={cursor}
          dateKey={dayKey}
          appointments={byDate.get(dayKey) ?? []}
          services={services}
          canCreate={canCreate}
          canEdit={canEdit}
          highlightStaffProfileId={highlightStaffProfileId}
          onSelect={handleSelect}
          onSlotClick={handleSlotClick}
        />
      )}

      {createSlot && (
        <CreateAppointmentModal
          date={createSlot.date}
          startTime={createSlot.startTime}
          services={services}
          onClose={() => setCreateSlot(null)}
          onSubmit={createAppointment}
        />
      )}

      {selected && (
        <div className="card apt-calendar__detail">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-lotus-800">{selected.name}</p>
              <p className="text-[11px] text-gray-500">{selected.phone}</p>
              <p className="mt-1 text-[11px]">
                {selected.date} · {selected.startTime}–{selected.endTime}
              </p>
              <p className="text-[11px] text-gray-600">{selected.service.name}</p>
              {selected.assignedStaff && (
                <p className="mt-1 text-[10px] text-lotus-600">
                  Usta: {selected.assignedStaff.label}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {!canEdit(selected) && multiAdminEnabled && !isSuperAdmin && (
                <p className="max-w-[14rem] text-right text-[10px] text-amber-700">
                  Salt okunur — size atanmamış randevu
                </p>
              )}
              {canEdit(selected) && selected.status === "PENDING" && (
                <button
                  type="button"
                  className="btn-primary !py-1.5 !text-xs"
                  disabled={statusSaving}
                  onClick={() => updateStatus(selected.id, "CONFIRMED")}
                >
                  {statusSaving ? "Kaydediliyor…" : "Randevu Onayla"}
                </button>
              )}
              {canEdit(selected) &&
                selected.status !== "CANCELLED" &&
                selected.status !== "COMPLETED" && (
                  <button
                    type="button"
                    className="text-[10px] text-red-600 hover:underline disabled:opacity-50"
                    disabled={statusSaving}
                    onClick={() => updateStatus(selected.id, "CANCELLED")}
                  >
                    Randevuyu iptal et
                  </button>
                )}
              <label className="label !mb-0">Durum</label>
              <select
                className="input !w-auto"
                value={selected.status}
                disabled={statusSaving || !canEdit(selected)}
                onChange={(e) => updateStatus(selected.id, e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
              {statusError && (
                <p className="max-w-[14rem] text-right text-[10px] text-red-600">
                  {statusError}
                </p>
              )}
              <button
                type="button"
                className="text-[10px] text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setSelectedId(null);
                  setStatusError("");
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AptChip({
  apt,
  compact,
  onSelect,
}: {
  apt: CalendarAppointment;
  compact?: boolean;
  onSelect: (a: CalendarAppointment) => void;
}) {
  return (
    <button
      type="button"
      className={`${statusChip[apt.status] ?? "apt-chip"} w-full text-left`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(apt);
      }}
      title={`${apt.name} — ${apt.service.name}`}
    >
      {!compact && <span className="apt-chip__time">{apt.startTime}</span>}
      <span className="apt-chip__name truncate">
        {compact ? `${apt.startTime} ` : ""}
        {apt.name}
      </span>
    </button>
  );
}

function MonthView({
  cursor,
  byDate,
  onSelect,
  onDayClick,
}: {
  cursor: Date;
  byDate: Map<string, CalendarAppointment[]>;
  onSelect: (a: CalendarAppointment) => void;
  onDayClick: (dateKey: string) => void;
}) {
  const days = getMonthGridDays(cursor);
  const todayKey = todayString();

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="apt-calendar__weekdays">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="apt-calendar__weekday">
            {d}
          </div>
        ))}
      </div>
      <div className="apt-calendar__month-grid">
        {days.map((day) => {
          const key = toDateKey(day);
          const dayApts = byDate.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const isDayToday = key === todayKey;

          return (
            <button
              key={key}
              type="button"
              className={`apt-calendar__day-cell ${!inMonth ? "apt-calendar__day-cell--muted" : ""} ${isDayToday ? "apt-calendar__day-cell--today" : ""}`}
              onClick={() => onDayClick(key)}
            >
              <span className="apt-calendar__day-num">{format(day, "d")}</span>
              <div className="apt-calendar__day-events">
                {dayApts.slice(0, 3).map((a) => (
                  <AptChip key={a.id} apt={a} compact onSelect={onSelect} />
                ))}
                {dayApts.length > 3 && (
                  <span className="apt-calendar__more">
                    +{dayApts.length - 3} daha
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  cursor,
  byDate,
  onSelect,
  onDayClick,
}: {
  cursor: Date;
  byDate: Map<string, CalendarAppointment[]>;
  onSelect: (a: CalendarAppointment) => void;
  onDayClick: (dateKey: string) => void;
}) {
  const days = getWeekDays(cursor);
  const todayKey = todayString();

  return (
    <div className="card !p-0 overflow-x-auto">
      <div className="apt-calendar__week-grid min-w-[42rem]">
        {days.map((day) => {
          const key = toDateKey(day);
          const dayApts = byDate.get(key) ?? [];
          const isDayToday = key === todayKey;

          return (
            <div
              key={key}
              className={`apt-calendar__week-col ${isDayToday ? "apt-calendar__week-col--today" : ""}`}
            >
              <button
                type="button"
                className="apt-calendar__week-header"
                onClick={() => onDayClick(key)}
              >
                <span className="text-[10px] text-gray-500">
                  {format(day, "EEE", { locale: tr })}
                </span>
                <span
                  className={`text-sm font-semibold ${isDayToday ? "text-lotus-700" : ""}`}
                >
                  {format(day, "d MMM", { locale: tr })}
                </span>
              </button>
              <div className="apt-calendar__week-body">
                {dayApts.length === 0 ? (
                  <p className="p-2 text-[10px] text-gray-400">—</p>
                ) : (
                  dayApts.map((a) => (
                    <AptChip key={a.id} apt={a} onSelect={onSelect} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function aptOccupiesSlot(apt: CalendarAppointment, slotTime: string): boolean {
  const slotMin = timeToMinutes(slotTime);
  return (
    slotMin >= timeToMinutes(apt.startTime) && slotMin < timeToMinutes(apt.endTime)
  );
}

function DailyScheduleGrid({
  cursor,
  dateKey,
  appointments,
  services,
  canCreate,
  canEdit,
  highlightStaffProfileId,
  onSelect,
  onSlotClick,
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
}) {
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setScheduleLoading(true);
    fetch(`/api/admin/appointments/schedule?date=${dateKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSchedule(data as DaySchedule);
      })
      .finally(() => {
        if (!cancelled) setScheduleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  const activeAppointments = appointments.filter((a) => a.status !== "CANCELLED");
  const dayShort = format(cursor, "EEE", { locale: tr });
  const slotSet = new Set(schedule?.slots ?? []);
  const orphanAppointments = activeAppointments.filter(
    (a) => !slotSet.has(a.startTime)
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
              ? "boş saate tıklayarak randevu ekleyin"
              : "boş saatlere tıklayarak görüntüleyin"}
          </p>
          <div className="apt-calendar__slot-grid mt-2">
            {schedule.slots.map((slotTime) => {
              const starting = activeAppointments.find(
                (a) => a.startTime === slotTime
              );
              const occupied = activeAppointments.some((a) =>
                aptOccupiesSlot(a, slotTime)
              );
              const isFree = !occupied;

              if (starting) {
                const chip =
                  statusChip[starting.status]?.replace("apt-chip ", "") ?? "";
                const isMine =
                  highlightStaffProfileId &&
                  starting.assignedStaffId === highlightStaffProfileId;
                const readOnly = !canEdit(starting);
                return (
                  <button
                    key={slotTime}
                    type="button"
                    className={`apt-calendar__slot-chip apt-calendar__slot-chip--booked ${chip} ${isMine ? "ring-2 ring-lotus-500 ring-offset-1" : ""}`}
                    onClick={() => onSelect(starting)}
                    title={
                      readOnly
                        ? `${starting.name} — salt okunur`
                        : `${starting.name} — ${starting.service.name}`
                    }
                  >
                    <span className="apt-calendar__slot-chip-time">{slotTime}</span>
                    <span className="apt-calendar__slot-chip-name truncate">
                      {starting.name}
                    </span>
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
                    disabled={!canCreate || services.length === 0}
                    title={canCreate ? "Randevu ekle" : "Randevu ekleme yetkisi yok"}
                  >
                    {slotTime}
                  </button>
                );
              }

              return (
                <span
                  key={slotTime}
                  className="apt-calendar__slot-chip apt-calendar__slot-chip--busy"
                  aria-hidden
                >
                  {slotTime}
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
                  {a.startTime}–{a.endTime} {a.name} · {a.service.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DayView({
  cursor,
  dateKey,
  appointments,
  services,
  canCreate,
  canEdit,
  highlightStaffProfileId,
  onSelect,
  onSlotClick,
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
}) {
  return (
    <DailyScheduleGrid
      cursor={cursor}
      dateKey={dateKey}
      appointments={appointments}
      services={services}
      canCreate={canCreate}
      canEdit={canEdit}
      highlightStaffProfileId={highlightStaffProfileId}
      onSelect={onSelect}
      onSlotClick={onSlotClick}
    />
  );
}

interface MemberOption {
  id: string;
  name: string;
  phone: string;
}

function CreateAppointmentModal({
  date,
  startTime,
  services,
  onClose,
  onSubmit,
}: {
  date: string;
  startTime: string;
  services: AdminServiceOption[];
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    phone: string;
    serviceId: string;
    date: string;
    startTime: string;
    note?: string;
    userId?: string;
  }) => Promise<{ memberCreated?: boolean } | void>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<MemberOption[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [showMemberList, setShowMemberList] = useState(false);
  const [info, setInfo] = useState("");

  useEffect(() => {
    const q = memberQuery.trim();
    if (q.length < 2) {
      setMemberResults([]);
      setMemberLoading(false);
      return;
    }

    setMemberLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/admin/members?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          setMemberResults(Array.isArray(data) ? data : []);
          setShowMemberList(true);
        })
        .catch(() => setMemberResults([]))
        .finally(() => setMemberLoading(false));
    }, 280);

    return () => clearTimeout(timer);
  }, [memberQuery]);

  function pickMember(member: MemberOption) {
    setSelectedMember(member);
    setName(member.name);
    setPhone(member.phone);
    setMemberQuery("");
    setMemberResults([]);
    setShowMemberList(false);
  }

  function clearSelectedMember() {
    setSelectedMember(null);
    setMemberQuery("");
    setMemberResults([]);
  }

  const selectedService = services.find((s) => s.id === serviceId);
  const endPreview = selectedService
    ? minutesToTime(
        timeToMinutes(startTime) + selectedService.durationMinutes
      )
    : startTime;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim() || !serviceId) {
      setError("Ad, telefon ve hizmet zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const result = await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        serviceId,
        date,
        startTime,
        note: note.trim() || undefined,
        userId: selectedMember?.id,
      });
      if (result?.memberCreated) {
        setInfo(
          "Yeni üyelik oluşturuldu. Müşteri adı veya telefon ile şifre 123456 olarak giriş yapabilir."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="apt-calendar__modal-backdrop"
      role="presentation"
      onClick={() => onClose()}
    >
      <form
        className="card apt-calendar__modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 className="font-semibold text-lotus-800">Yeni randevu</h3>
        <p className="text-[11px] text-gray-600">
          {date} · {startTime}
          {selectedService && ` – ${endPreview}`} (onaylı)
        </p>

        {error && (
          <p className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-700">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded bg-green-50 px-2 py-1 text-[11px] text-green-800">
            {info}
          </p>
        )}
        {!selectedMember && (
          <p className="text-[10px] text-gray-500">
            Kayıtlı müşteri seçilmezse otomatik üyelik açılır (varsayılan şifre:{" "}
            <strong>123456</strong>).
          </p>
        )}

        <div className="relative sm:col-span-2">
          <label className="label">Kayıtlı müşteri</label>
          {selectedMember ? (
            <div className="flex flex-wrap items-center gap-2 rounded border border-lotus-200 bg-lotus-50/80 px-2 py-1.5">
              <span className="text-[11px] font-medium text-lotus-900">
                {selectedMember.name} · {formatPhoneDisplay(selectedMember.phone)}
              </span>
              <button
                type="button"
                className="text-[10px] font-semibold text-lotus-700 hover:underline"
                onClick={clearSelectedMember}
              >
                Değiştir
              </button>
            </div>
          ) : (
            <>
              <input
                className="input"
                value={memberQuery}
                onChange={(e) => {
                  setMemberQuery(e.target.value);
                  setShowMemberList(true);
                }}
                onFocus={() => memberResults.length > 0 && setShowMemberList(true)}
                placeholder="Ad veya telefon ile ara (en az 2 karakter)"
                autoComplete="off"
                autoFocus
              />
              {memberLoading && (
                <p className="mt-0.5 text-[10px] text-gray-400">Aranıyor…</p>
              )}
              {showMemberList && memberResults.length > 0 && (
                <ul
                  className="apt-calendar__member-list"
                  role="listbox"
                  aria-label="Kayıtlı müşteriler"
                >
                  {memberResults.map((m) => (
                    <li key={m.id} role="option">
                      <button
                        type="button"
                        className="apt-calendar__member-option"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickMember(m)}
                      >
                        <span className="font-medium">{m.name}</span>
                        <span className="text-gray-500">
                          {formatPhoneDisplay(m.phone)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {showMemberList &&
                !memberLoading &&
                memberQuery.trim().length >= 2 &&
                memberResults.length === 0 && (
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    Kayıtlı müşteri bulunamadı — aşağıdan manuel girebilirsiniz.
                  </p>
                )}
            </>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="label">Ad Soyad</label>
            <input
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (selectedMember && e.target.value !== selectedMember.name) {
                  setSelectedMember(null);
                }
              }}
              required
            />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (selectedMember && e.target.value !== selectedMember.phone) {
                  setSelectedMember(null);
                }
              }}
              placeholder="05XX XXX XX XX"
              required
            />
          </div>
          <div className="sm:col-span-2">
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
            <label className="label">Not (opsiyonel)</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => onClose()}>
            İptal
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Kaydediliyor…" : "Randevu kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
