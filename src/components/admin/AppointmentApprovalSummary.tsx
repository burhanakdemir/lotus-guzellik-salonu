"use client";

import type { ReactNode } from "react";
import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import { formatPhoneDisplay } from "@/lib/phone";

type Props = {
  pending: CalendarAppointment[];
  canEdit: (apt: CalendarAppointment) => boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSelect?: (apt: CalendarAppointment) => void;
  statusSaving?: boolean;
  showStaff?: boolean;
  dailyPanel?: ReactNode;
  /** @deprecated Yalnızca uyumluluk; grid artık CSS ile */
  compact?: boolean;
};

export function AppointmentApprovalSummary({
  pending,
  canEdit,
  onApprove,
  onReject,
  onSelect,
  statusSaving = false,
  showStaff = false,
  dailyPanel,
  compact: _compact,
}: Props) {
  const pendingSection = (
    <section className="card space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h3 className="!mb-0 text-sm font-semibold text-lotus-800">
          Onay bekleyen randevular
        </h3>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
          {pending.length}
        </span>
      </div>
      <p className="text-[10px] text-gray-500">
        Müşteri randevuları usta onayı olmadan onaylanmaz. Süper admin tüm
        randevuları onaylayabilir.
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
                className="w-full text-left"
                onClick={() => onSelect?.(a)}
              >
                <span className="block text-[11px] font-semibold text-gray-900">
                  {a.startTime}–{a.endTime} · {a.service.name}
                </span>
                <span className="text-[10px] text-gray-600">
                  {a.name} · {formatPhoneDisplay(a.phone)}
                </span>
                <span className="text-[10px] text-gray-500">
                  {a.date}
                  {showStaff && a.assignedStaff
                    ? ` · ${a.assignedStaff.label}`
                    : !a.assignedStaffId
                      ? " · Usta atanmadı"
                      : ""}
                </span>
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
    </section>
  );

  if (!dailyPanel) {
    return <div className="apt-approval-summary">{pendingSection}</div>;
  }

  return (
    <div className="apt-approval-summary">
      {pendingSection}
      {dailyPanel}
    </div>
  );
}
