"use client";

import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import { getAppointmentMemberDisplayName } from "@/lib/admin-appointment-line";
import { formatPhoneDisplay } from "@/lib/phone";
import { getStaffDisplayName } from "@/lib/staff-display-name";

const statusLabels: Record<string, string> = {
  PENDING: "Onay bekliyor",
  CONFIRMED: "Onaylandı",
  CANCELLED: "İptal",
  COMPLETED: "Tamamlandı",
};

export function AppointmentViewModal({
  apt,
  multiAdminEnabled,
  canEdit,
  canCancel,
  onClose,
  onEdit,
  onCancel,
  actionSaving = false,
}: {
  apt: CalendarAppointment;
  multiAdminEnabled: boolean;
  canEdit: boolean;
  canCancel: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  actionSaving?: boolean;
}) {
  const memberName = getAppointmentMemberDisplayName(apt);

  return (
    <div
      className="apt-calendar__modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="card apt-calendar__modal"
        role="dialog"
        aria-labelledby="apt-view-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="apt-view-title" className="font-semibold text-lotus-800">
          Randevu bilgisi
        </h3>
        <p className="text-[11px] text-gray-500">
          {apt.date} · {apt.startTime}–{apt.endTime}
        </p>

        <section className="space-y-2 rounded border border-lotus-100 bg-lotus-50/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-lotus-700">
            Üye bilgileri
          </p>
          <dl className="grid gap-1.5 text-[11px]">
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-gray-600">Ad Soyad</dt>
              <dd className="text-gray-900">{memberName}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-gray-600">Telefon</dt>
              <dd className="text-gray-900">{formatPhoneDisplay(apt.phone)}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-gray-600">Hizmet</dt>
              <dd className="text-gray-900">{apt.service.name}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-gray-600">Durum</dt>
              <dd className="text-gray-900">
                {statusLabels[apt.status] ?? apt.status}
              </dd>
            </div>
            {multiAdminEnabled && (
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-medium text-gray-600">Usta</dt>
                <dd className="text-gray-900">
                  {apt.assignedStaff
                    ? getStaffDisplayName(apt.assignedStaff)
                    : "Atanmadı"}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-2">
          {canCancel && onCancel && (
            <button
              type="button"
              className="btn-secondary !border-red-200 !text-red-700 hover:!bg-red-50"
              disabled={actionSaving}
              onClick={() => void onCancel()}
            >
              {actionSaving ? "İptal ediliyor…" : "Randevuyu iptal et"}
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={actionSaving}
          >
            Kapat
          </button>
          {canEdit && onEdit && (
            <button
              type="button"
              className="btn-primary"
              onClick={onEdit}
              disabled={actionSaving}
            >
              Düzenle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
