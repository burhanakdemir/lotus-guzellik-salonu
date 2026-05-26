"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppointmentApprovalSummary } from "@/components/admin/AppointmentApprovalSummary";
import { DailyAppointmentsCard } from "@/components/admin/DailyAppointmentsCard";
import type { AdminServiceOption } from "@/components/admin/AppointmentsAdmin";
import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import {
  StaffPersonelTabs,
  type StaffProfileTab,
} from "@/components/admin/StaffPersonelTabs";
import { canEditAppointment } from "@/lib/admin-permissions";
import type { StaffStatusCounts } from "@/lib/admin-appointment-status";
import { countsForStaffProfile } from "@/lib/admin-appointment-status";
import { adminAppointmentStatusHref } from "@/lib/staff-display-name";
import { parseDateKey, toDateKey } from "@/lib/calendar-dates";
import type { SalonDaySchedule } from "@/lib/salon-schedule";

function filterByStaff(
  list: CalendarAppointment[],
  staffId: string | null
): CalendarAppointment[] {
  if (staffId === null) return list;
  return list.filter((a) => a.assignedStaffId === staffId);
}

type Props = {
  today: string;
  initialPending: CalendarAppointment[];
  initialToday: CalendarAppointment[];
  services: AdminServiceOption[];
  staffProfiles?: StaffProfileTab[];
  initialActiveStaffId?: string | null;
  isSuperAdmin: boolean;
  currentStaffProfileId: string | null;
  multiAdminEnabled: boolean;
  initialDaySchedule: SalonDaySchedule;
  memberCount?: number;
  weekAppointments?: number;
  pendingTotalCount?: number;
  confirmedTotalCount?: number;
  staffStatusCountMap?: Record<string, StaffStatusCounts> | null;
};

export function AdminDashboardPanels({
  today,
  initialPending,
  initialToday,
  services,
  staffProfiles = [],
  initialActiveStaffId = null,
  isSuperAdmin,
  currentStaffProfileId,
  multiAdminEnabled,
  initialDaySchedule,
  memberCount = 0,
  weekAppointments = 0,
  pendingTotalCount,
  confirmedTotalCount = 0,
  staffStatusCountMap = null,
}: Props) {
  const showStaffTabs = multiAdminEnabled && staffProfiles.length > 0;

  const [activeStaffId, setActiveStaffId] = useState<string | null>(
    initialActiveStaffId
  );
  const [pending, setPending] = useState(initialPending);
  const [todayList, setTodayList] = useState(initialToday);
  const [allDayByDate, setAllDayByDate] = useState<Record<string, CalendarAppointment[]>>({
    [today]: initialToday,
  });
  const [cursor, setCursor] = useState(() => parseDateKey(today));
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  const fetchedDaysRef = useRef(new Set<string>([today]));

  const dayKey = toDateKey(cursor);

  const activeProfile = useMemo(
    () => staffProfiles.find((p) => p.id === activeStaffId) ?? null,
    [staffProfiles, activeStaffId]
  );

  const actor = {
    role: (isSuperAdmin ? "ADMIN" : "STAFF_ADMIN") as "ADMIN" | "STAFF_ADMIN",
    staffProfileId: currentStaffProfileId,
  };

  function canEdit(apt: CalendarAppointment) {
    if (!multiAdminEnabled || isSuperAdmin) return true;
    return canEditAppointment(actor, {
      assignedStaffId: apt.assignedStaffId ?? null,
    });
  }

  const filteredPending = useMemo(
    () => filterByStaff(pending, activeStaffId),
    [pending, activeStaffId]
  );

  const daySource = allDayByDate[dayKey] ?? (dayKey === today ? todayList : []);
  const filteredDay = useMemo(
    () => filterByStaff(daySource, activeStaffId),
    [daySource, activeStaffId]
  );

  useEffect(() => {
    if (dayKey === today) {
      setAllDayByDate((prev) => ({ ...prev, [today]: todayList }));
      return;
    }
    if (fetchedDaysRef.current.has(dayKey)) return;

    let cancelled = false;
    fetchedDaysRef.current.add(dayKey);
    fetch(`/api/admin/appointments?from=${dayKey}&to=${dayKey}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CalendarAppointment[]) => {
        if (!cancelled) {
          setAllDayByDate((prev) => ({ ...prev, [dayKey]: data }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllDayByDate((prev) => ({ ...prev, [dayKey]: [] }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dayKey, today, todayList]);

  const pendingSorted = useMemo(
    () =>
      [...filteredPending].sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
      }),
    [filteredPending]
  );

  const daySorted = useMemo(
    () =>
      [...filteredDay].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [filteredDay]
  );

  const scopedStatusCounts = useMemo(() => {
    if (staffStatusCountMap) {
      return countsForStaffProfile(staffStatusCountMap, activeStaffId);
    }
    return {
      pending: pendingTotalCount ?? filteredPending.length,
      confirmed: confirmedTotalCount,
    };
  }, [
    staffStatusCountMap,
    activeStaffId,
    pendingTotalCount,
    confirmedTotalCount,
    filteredPending.length,
  ]);

  const statsPending = scopedStatusCounts.pending;
  const statsToday = filteredDay.length;
  const displayPendingCount = scopedStatusCounts.pending;
  const displayConfirmedCount = scopedStatusCounts.confirmed;
  const statusListStaffSlug = activeProfile?.slug ?? null;

  const pendingCountFor = useMemo(() => {
    if (staffStatusCountMap) {
      return (staffId: string | null) =>
        countsForStaffProfile(staffStatusCountMap, staffId).pending;
    }
    return (staffId: string | null) => {
      if (staffId === null) {
        return pending.filter((a) => a.status === "PENDING").length;
      }
      return pending.filter(
        (a) => a.status === "PENDING" && a.assignedStaffId === staffId
      ).length;
    };
  }, [pending, staffStatusCountMap]);

  function applyUpdate(updated: CalendarAppointment) {
    setPending((prev) => prev.filter((a) => a.id !== updated.id));
    const patch = (list: CalendarAppointment[]) =>
      list.map((a) => (a.id === updated.id ? { ...a, ...updated } : a));
    setTodayList(patch);
    setAllDayByDate((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = patch(next[key] ?? []);
      }
      return next;
    });
  }

  async function approve(id: string) {
    setStatusSaving(true);
    setStatusError("");
    try {
      const res = await fetch(`/api/admin/appointments/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusError(
          (data as { error?: string }).error || "Onaylanamadı."
        );
        return;
      }
      const updated = (data as { appointment: CalendarAppointment })
        .appointment;
      if (updated) applyUpdate(updated);
    } catch {
      setStatusError("Bağlantı hatası.");
    } finally {
      setStatusSaving(false);
    }
  }

  async function reject(id: string) {
    setStatusSaving(true);
    setStatusError("");
    try {
      const res = await fetch(`/api/admin/appointments/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusError(
          (data as { error?: string }).error || "Reddedilemedi."
        );
        return;
      }
      const updated = (data as { appointment: CalendarAppointment })
        .appointment;
      if (updated) applyUpdate(updated);
    } catch {
      setStatusError("Bağlantı hatası.");
    } finally {
      setStatusSaving(false);
    }
  }

  const highlightId = activeStaffId ?? currentStaffProfileId ?? undefined;
  const panelTitle = activeProfile
    ? activeProfile.displayName
    : showStaffTabs
      ? "Tüm ustalar"
      : null;

  return (
    <div className="admin-dashboard-stack">
      {showStaffTabs && (
        <StaffPersonelTabs
          profiles={staffProfiles}
          activeStaffId={activeStaffId}
          onSelect={setActiveStaffId}
          showAllTab={isSuperAdmin}
          variant="admin"
          pendingCountFor={pendingCountFor}
        />
      )}

      {panelTitle && (
        <>
          <p className="admin-staff-panel-title">{panelTitle}</p>
          {!isSuperAdmin &&
            activeStaffId &&
            activeStaffId !== currentStaffProfileId && (
              <p className="admin-staff-panel-hint">
                Başka ustanın randevuları — salt okunur.
              </p>
            )}
        </>
      )}

      <div className="admin-stats">
        <Link
          href={adminAppointmentStatusHref("pending", statusListStaffSlug)}
          className="card admin-stat-card admin-stat-card--link"
        >
          <p className="admin-stat-card__label">Onay bekleyen</p>
          <p className="admin-stat-card__value admin-stat-card__value--amber">
            {statsPending}
          </p>
        </Link>
        <div className="card admin-stat-card">
          <p className="admin-stat-card__label">Bugün</p>
          <p className="admin-stat-card__value admin-stat-card__value--lotus">
            {statsToday}
          </p>
        </div>
        {isSuperAdmin && (
          <>
            <div className="card admin-stat-card">
              <p className="admin-stat-card__label">Üye</p>
              <p className="admin-stat-card__value admin-stat-card__value--lotus">
                {memberCount}
              </p>
            </div>
            <div className="card admin-stat-card">
              <p className="admin-stat-card__label">Gelecek</p>
              <p className="admin-stat-card__value admin-stat-card__value--lotus">
                {weekAppointments}
              </p>
            </div>
          </>
        )}
      </div>

      <AppointmentApprovalSummary
        pending={pendingSorted}
        pendingCount={pendingTotalCount}
        displayPendingCount={displayPendingCount}
        confirmedCount={displayConfirmedCount}
        statusListStaffSlug={statusListStaffSlug}
        canEdit={canEdit}
        onApprove={approve}
        onReject={reject}
        statusSaving={statusSaving}
        showStaff={multiAdminEnabled && activeStaffId === null}
        dailyPanel={
          <DailyAppointmentsCard
            cursor={cursor}
            onCursorChange={setCursor}
            appointments={daySorted}
            services={services}
            canCreate={false}
            canEdit={canEdit}
            highlightStaffProfileId={highlightId}
            onSelect={() => {}}
            onSlotClick={() => {}}
            initialSchedule={
              dayKey === today ? initialDaySchedule : null
            }
          />
        }
      />

      {statusError && (
        <p className="text-[11px] text-red-600" role="alert">
          {statusError}
        </p>
      )}
      <p className="admin-stat-card__label">
        <Link
          href={
            activeProfile
              ? `/admin/randevular?personel=${activeProfile.slug}`
              : "/admin/randevular"
          }
          className="admin-link"
        >
          {activeProfile
            ? `${activeProfile.displayName} takvimi →`
            : "Takvimde randevu ekle veya düzenle →"}
        </Link>
      </p>
    </div>
  );
}
