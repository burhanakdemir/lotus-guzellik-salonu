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
    <section className="apt-approval-summary__card space-y-2">
      <Link href={pendingHref} className="apt-approval-summary__card-link">
        <h3 className="apt-approval-summary__card-title">
          Onay bekleyen randevular
        </h3>
        <span className="apt-approval-summary__badge">{badgePending}</span>
      </Link>
      <p className="apt-approval-summary__card-hint">
        Müşteri randevuları usta onayı olmadan onaylanmaz. Başlığa tıklayarak
        tüm listeyi görün.
      </p>
      {pending.length === 0 ? (
        <p className="apt-approval-summary__card-hint">Bekleyen randevu yok.</p>
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
        <p className="apt-approval-summary__card-hint">
          <Link href={pendingHref} className="admin-link">
            Tümünü gör ({badgePending})
          </Link>
        </p>
      )}
    </section>
  );

  const confirmedSection = (
    <section className="apt-approval-summary__card space-y-1">
      <Link href={confirmedHref} className="apt-approval-summary__card-link">
        <h3 className="apt-approval-summary__card-title">
          Onaylı randevularınız
        </h3>
        <span className="apt-approval-summary__badge">{confirmedCount}</span>
      </Link>
      <p className="apt-approval-summary__card-hint">
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
