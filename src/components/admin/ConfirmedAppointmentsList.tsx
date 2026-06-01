"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import { getAppointmentBookerName } from "@/lib/admin-appointment-line";
import { formatPhoneDisplay } from "@/lib/phone";
import { isAppointmentInPast } from "@/lib/timezone";

type Tab = "upcoming" | "past";

type Props = {
  appointments: CalendarAppointment[];
  showStaff?: boolean;
  staffBannerName?: string | null;
  backHref?: string;
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
}: {
  appointments: CalendarAppointment[];
  showStaffColumn: boolean;
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
          <li
            key={apt.id}
            className={`confirmed-apt-table__row ${gridClass}`}
            role="row"
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
}: Props) {
  const banner = staffBannerName?.trim() || null;
  const showStaffColumn = showStaff && !banner;
  const [tab, setTab] = useState<Tab>("upcoming");

  const { upcoming, past } = useMemo(() => {
    const up: CalendarAppointment[] = [];
    const pa: CalendarAppointment[] = [];
    for (const apt of appointments) {
      if (isAppointmentInPast(apt.date, apt.endTime)) pa.push(apt);
      else up.push(apt);
    }
    up.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    pa.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
    return { upcoming: up, past: pa };
  }, [appointments]);

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
        />
      )}
    </div>
  );
}
