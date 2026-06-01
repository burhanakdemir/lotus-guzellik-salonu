"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import { canEditAppointment } from "@/lib/admin-permissions";
import { AdminAppointmentBlock } from "@/components/admin/AdminAppointmentBlock";

type Props = {
  appointments: CalendarAppointment[];
  variant: "pending" | "confirmed";
  isSuperAdmin: boolean;
  currentStaffProfileId: string | null;
  multiAdminEnabled: boolean;
  backHref?: string;
};

export function AppointmentStatusList({
  appointments,
  variant,
  isSuperAdmin,
  currentStaffProfileId,
  multiAdminEnabled,
  backHref = "/admin/randevular",
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(appointments);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");

  const actor = {
    role: (isSuperAdmin ? "ADMIN" : "STAFF_ADMIN") as "ADMIN" | "STAFF_ADMIN",
    staffProfileId: currentStaffProfileId,
  };

  function canEdit(apt: CalendarAppointment) {
    if (variant !== "pending") return false;
    if (!multiAdminEnabled || isSuperAdmin) return true;
    return canEditAppointment(actor, {
      assignedStaffId: apt.assignedStaffId ?? null,
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
      setRows((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
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
      setRows((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch {
      setStatusError("Bağlantı hatası.");
    } finally {
      setStatusSaving(false);
    }
  }

  const showStaff = multiAdminEnabled;

  return (
    <div className="apt-status-list space-y-2">
      <nav className="admin-page-nav" aria-label="Geri dön">
        <Link href={backHref} className="admin-nav-btn">
          ← Geri
        </Link>
      </nav>

      {statusError && (
        <p className="text-[11px] text-red-600" role="alert">
          {statusError}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="card text-[11px] text-gray-500">
          {variant === "pending"
            ? "Onay bekleyen randevu yok."
            : "Onaylı randevu yok."}
        </p>
      ) : (
        <ul className="apt-status-list__items space-y-1">
          {rows.map((a) => (
            <li
              key={a.id}
              className={
                variant === "pending"
                  ? "apt-status-list__item apt-status-list__item--pending card"
                  : "apt-status-list__item card"
              }
            >
              <AdminAppointmentBlock apt={a} showStaff={showStaff} />
              {canEdit(a) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="btn-primary !py-0.5 !text-[10px]"
                    disabled={statusSaving}
                    onClick={() => approve(a.id)}
                  >
                    Onayla
                  </button>
                  <button
                    type="button"
                    className="btn-secondary !py-0.5 !text-[10px] !text-red-700"
                    disabled={statusSaving}
                    onClick={() => reject(a.id)}
                  >
                    Reddet
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
