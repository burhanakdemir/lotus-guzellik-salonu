"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import { AppointmentViewModal } from "@/components/admin/AppointmentViewModal";
import { getAppointmentBookerName } from "@/lib/admin-appointment-line";
import { canEditAppointment } from "@/lib/admin-permissions";
import { formatPhoneDisplay } from "@/lib/phone";
import { isAppointmentInPast } from "@/lib/timezone";

type Tab = "upcoming" | "past";

type Props = {
  appointments: CalendarAppointment[];
  showStaff?: boolean;
  staffBannerName?: string | null;
  backHref?: string;
  isSuperAdmin?: boolean;
  currentStaffProfileId?: string | null;
  multiAdminEnabled?: boolean;
};

const BASE_COLUMNS = [
  "Ad-Soyad",
  "Telefon No",
  "Randevu Tarihi",
  "Randevu Saati",
  "Hizmet Adı",
] as const;

function formatAppointmentDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}.${m}.${y}`;
}

function sortKey(apt: CalendarAppointment): string {
  return `${apt.date}T${apt.startTime}`;
}

function getStaffLabel(apt: CalendarAppointment): string {
  return (
    apt.assignedStaff?.label?.trim() ||
    apt.assignedStaff?.user?.name?.trim() ||
    "—"
  );
}

function ConfirmedAppointmentsTable({
  appointments,
  showStaffColumn,
  onSelect,
}: {
  appointments: CalendarAppointment[];
  showStaffColumn: boolean;
  onSelect: (apt: CalendarAppointment) => void;
}) {
  const columns = showStaffColumn ? [...BASE_COLUMNS, "Usta"] : [...BASE_COLUMNS];
  const gridClass = showStaffColumn
    ? "confirmed-apt-table__grid confirmed-apt-table__grid--staff"
    : "confirmed-apt-table__grid";

  return (
    <div className="confirmed-apt-table card !p-0 overflow-hidden">
      <div className={`confirmed-apt-table__head ${gridClass}`} role="row">
        {columns.map((label) => (
          <span key={label} className="confirmed-apt-table__th" role="columnheader">
            {label}
          </span>
        ))}
      </div>
      <ul className="confirmed-apt-table__body">
        {appointments.map((apt) => (
          <li key={apt.id} role="row">
            <button
              type="button"
              className={`confirmed-apt-table__row confirmed-apt-table__row-btn ${gridClass}`}
              onClick={() => onSelect(apt)}
            >
            <span className="confirmed-apt-table__td" role="cell">
              {getAppointmentBookerName(apt)}
            </span>
            <span className="confirmed-apt-table__td" role="cell">
              {formatPhoneDisplay(apt.phone)}
            </span>
            <span className="confirmed-apt-table__td" role="cell">
              {formatAppointmentDate(apt.date)}
            </span>
            <span className="confirmed-apt-table__td" role="cell">
              {apt.startTime} – {apt.endTime}
            </span>
            <span className="confirmed-apt-table__td" role="cell">
              {apt.service.name}
            </span>
            {showStaffColumn && (
              <span className="confirmed-apt-table__td" role="cell">
                {getStaffLabel(apt)}
              </span>
            )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConfirmedAppointmentsList({
  appointments,
  showStaff = false,
  staffBannerName = null,
  backHref = "/admin/randevular",
  isSuperAdmin = true,
  currentStaffProfileId = null,
  multiAdminEnabled = false,
}: Props) {
  const banner = staffBannerName?.trim() || null;
  const showStaffColumn = showStaff && !banner;
  const [tab, setTab] = useState<Tab>("upcoming");
  const [rows, setRows] = useState(appointments);
  const [viewApt, setViewApt] = useState<CalendarAppointment | null>(null);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionError, setActionError] = useState("");

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

  async function cancelAppointment(id: string) {
    const apt = rows.find((a) => a.id === id);
    if (apt && !canEdit(apt)) {
      setActionError("Bu randevuyu iptal etme yetkiniz yok.");
      return;
    }
    if (
      !window.confirm(
        "Bu randevuyu iptal etmek istediğinize emin misiniz?"
      )
    ) {
      return;
    }
    setActionError("");
    setActionSaving(true);
    try {
      const res = await fetch(`/api/admin/appointments/${id}/cancel`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(
          (data as { error?: string }).error || "İptal edilemedi."
        );
        return;
      }
      const updated = (data as { appointment: CalendarAppointment }).appointment;
      setRows((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
      );
      setViewApt(null);
    } catch {
      setActionError("Bağlantı hatası.");
    } finally {
      setActionSaving(false);
    }
  }

  useEffect(() => {
    setRows(appointments);
  }, [appointments]);

  const { upcoming, past } = useMemo(() => {
    const up: CalendarAppointment[] = [];
    const pa: CalendarAppointment[] = [];
    for (const apt of rows) {
      if (apt.status === "CANCELLED") continue;
      if (isAppointmentInPast(apt.date, apt.endTime)) pa.push(apt);
      else up.push(apt);
    }
    up.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    pa.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
    return { upcoming: up, past: pa };
  }, [rows]);

  const activeList = tab === "upcoming" ? upcoming : past;

  return (
    <div className="confirmed-apt-list space-y-3">
      <nav className="admin-page-nav" aria-label="Geri dön">
        <Link href={backHref} className="admin-nav-btn">
          ← Geri
        </Link>
      </nav>

      <div
        className="confirmed-apt-list__tabs"
        role="tablist"
        aria-label="Onaylı randevu dönemi"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upcoming"}
          className={
            tab === "upcoming"
              ? "confirmed-apt-list__tab confirmed-apt-list__tab--active"
              : "confirmed-apt-list__tab"
          }
          onClick={() => setTab("upcoming")}
        >
          Gelecek randevular
          <span className="confirmed-apt-list__count">{upcoming.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "past"}
          className={
            tab === "past"
              ? "confirmed-apt-list__tab confirmed-apt-list__tab--active"
              : "confirmed-apt-list__tab"
          }
          onClick={() => setTab("past")}
        >
          Geçmiş randevular
          <span className="confirmed-apt-list__count">{past.length}</span>
        </button>
      </div>

      {banner && (
        <p className="confirmed-apt-list__staff-banner" aria-label="Usta">
          {banner}
        </p>
      )}

      {actionError && (
        <p className="rounded bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {actionError}
        </p>
      )}

      {activeList.length === 0 ? (
        <p className="card text-[11px] text-gray-500">
          {tab === "upcoming"
            ? "Gelecek tarihli onaylı randevu yok."
            : "Geçmiş onaylı randevu yok."}
        </p>
      ) : (
        <ConfirmedAppointmentsTable
          appointments={activeList}
          showStaffColumn={showStaffColumn}
          onSelect={setViewApt}
        />
      )}

      {viewApt && (
        <AppointmentViewModal
          apt={viewApt}
          multiAdminEnabled={multiAdminEnabled}
          canEdit={false}
          canCancel={
            canEdit(viewApt) &&
            viewApt.status !== "CANCELLED" &&
            viewApt.status !== "COMPLETED"
          }
          actionSaving={actionSaving}
          onClose={() => setViewApt(null)}
          onCancel={() => cancelAppointment(viewApt.id)}
        />
      )}
    </div>
  );
}
