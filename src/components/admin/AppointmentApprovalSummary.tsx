"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import { AdminAppointmentBlock } from "@/components/admin/AdminAppointmentBlock";
import { adminAppointmentStatusHref } from "@/lib/staff-display-name";

type Props = {
  pending: CalendarAppointment[];
  /** Tüm onay bekleyenler (tarih sınırı yok); sekme filtresi yokken rozet */
  pendingCount?: number;
  /** Onaylı (CONFIRMED) toplam */
  confirmedCount?: number;
  canEdit: (apt: CalendarAppointment) => boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSelect?: (apt: CalendarAppointment) => void;
  statusSaving?: boolean;
  showStaff?: boolean;
  dailyPanel?: ReactNode;
  /** Sekme ile filtrelenmiş bekleyen sayısı (varsa rozet) */
  displayPendingCount?: number;
  /** Süper admin usta sekmesinde liste URL parametresi */
  statusListStaffSlug?: string | null;
  /** @deprecated Yalnızca uyumluluk; grid artık CSS ile */
  compact?: boolean;
};

export function AppointmentApprovalSummary({
  pending,
  pendingCount,
  confirmedCount = 0,
  canEdit,
  onApprove,
  onReject,
  onSelect,
  statusSaving = false,
  showStaff = false,
  dailyPanel,
  displayPendingCount,
  statusListStaffSlug = null,
  compact: _compact,
}: Props) {
  const badgePending =
    displayPendingCount ?? pendingCount ?? pending.length;
  const pendingHref = adminAppointmentStatusHref("pending", statusListStaffSlug);
  const confirmedHref = adminAppointmentStatusHref(
    "confirmed",
    statusListStaffSlug
  );

  const pendingSection = (
    <section className="card space-y-2">
      <Link
        href={pendingHref}
        className="flex flex-wrap items-center justify-between gap-1 rounded-md -m-1 p-1 transition hover:bg-amber-50/80"
      >
        <h3 className="!mb-0 text-sm font-semibold text-lotus-800">
          Onay bekleyen randevular
        </h3>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
          {badgePending}
        </span>
      </Link>
      <p className="text-[10px] text-gray-500">
        Müşteri randevuları usta onayı olmadan onaylanmaz. Başlığa tıklayarak
        tüm listeyi görün.
      </p>
      {pending.length === 0 ? (
        <p className="text-[11px] text-gray-500">Bekleyen randevu yok.</p>
      ) : (
        <ul className="apt-approval-summary__list max-h-64 space-y-1 overflow-y-auto md:max-h-[28rem]">
          {pending.map((a) => (
            <li
              key={a.id}
              className="apt-approval-summary__item rounded border border-amber-200 bg-amber-50/60 px-2 py-1.5"
            >
              <button
                type="button"
                className="w-full min-w-0 text-left"
                onClick={() => onSelect?.(a)}
              >
                <AdminAppointmentBlock apt={a} showStaff={showStaff} />
              </button>
              {canEdit(a) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="btn-primary !py-0.5 !text-[10px]"
                    disabled={statusSaving}
                    onClick={() => onApprove(a.id)}
                  >
                    Onayla
                  </button>
                  <button
                    type="button"
                    className="btn-secondary !py-0.5 !text-[10px] !text-red-700"
                    disabled={statusSaving}
                    onClick={() => onReject(a.id)}
                  >
                    Reddet
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {badgePending > pending.length && (
        <p className="text-[10px] text-gray-500">
          <Link href={pendingHref} className="admin-link">
            Tümünü gör ({badgePending})
          </Link>
        </p>
      )}
    </section>
  );

  const confirmedSection = (
    <section className="card space-y-1">
      <Link
        href={confirmedHref}
        className="flex flex-wrap items-center justify-between gap-1 rounded-md -m-1 p-1 transition hover:bg-lotus-50/80"
      >
        <h3 className="!mb-0 text-sm font-semibold text-lotus-800">
          Onaylı randevularınız
        </h3>
        <span className="rounded-full bg-lotus-100 px-2 py-0.5 text-[10px] font-semibold text-lotus-900">
          {confirmedCount}
        </span>
      </Link>
      <p className="text-[10px] text-gray-500">
        Onaylanmış randevuların tam listesi için tıklayın.
      </p>
    </section>
  );

  if (!dailyPanel) {
    return (
      <div className="apt-approval-summary space-y-2">
        {pendingSection}
        {confirmedSection}
      </div>
    );
  }

  return (
    <div className="apt-approval-summary">
      <div className="apt-approval-summary__side space-y-2">
        {pendingSection}
        {confirmedSection}
      </div>
      {dailyPanel}
    </div>
  );
}
