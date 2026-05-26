"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppointmentsCalendar,
  type CalendarAppointment,
} from "@/components/admin/AppointmentsCalendar";
import {
  StaffPersonelTabs,
  type StaffProfileTab,
} from "@/components/admin/StaffPersonelTabs";
import type { CalendarView } from "@/lib/calendar-dates";
import type { StaffStatusCounts } from "@/lib/admin-appointment-status";
import { countsForStaffProfile } from "@/lib/admin-appointment-status";

export interface AdminServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
}

export function AppointmentsAdmin({
  initialAppointments,
  initialCursor,
  services,
  isSuperAdmin = true,
  currentStaffProfileId = null,
  multiAdminEnabled = false,
  staffProfiles = [],
  initialActiveStaffId = null,
  defaultView,
  pinnedDailyPanel = false,
  pendingTotalCount,
  confirmedTotalCount = 0,
  staffStatusCountMap = null,
  initialLoadedRange = null,
}: {
  initialAppointments: CalendarAppointment[];
  initialCursor?: string;
  initialLoadedRange?: { from: string; to: string } | null;
  services: AdminServiceOption[];
  isSuperAdmin?: boolean;
  currentStaffProfileId?: string | null;
  multiAdminEnabled?: boolean;
  staffProfiles?: StaffProfileTab[];
  initialActiveStaffId?: string | null;
  defaultView?: CalendarView;
  pinnedDailyPanel?: boolean;
  pendingTotalCount?: number;
  confirmedTotalCount?: number;
  staffStatusCountMap?: Record<string, StaffStatusCounts> | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStaffId, setActiveStaffId] = useState<string | null>(
    initialActiveStaffId
  );

  const showStaffTabs = multiAdminEnabled && staffProfiles.length > 0;

  const syncUrl = useCallback(
    (staffId: string | null) => {
      const slug = staffId
        ? staffProfiles.find((p) => p.id === staffId)?.slug
        : null;
      const params = new URLSearchParams(searchParams.toString());
      if (slug) params.set("personel", slug);
      else params.delete("personel");
      const q = params.toString();
      router.replace(q ? `/admin/randevular?${q}` : "/admin/randevular", {
        scroll: false,
      });
    },
    [router, searchParams, staffProfiles]
  );

  function handleStaffSelect(staffId: string | null) {
    if (!isSuperAdmin && staffId && staffId !== currentStaffProfileId) {
      setActiveStaffId(staffId);
      syncUrl(staffId);
      return;
    }
    setActiveStaffId(staffId);
    syncUrl(staffId);
  }

  const activeProfile = useMemo(
    () => staffProfiles.find((p) => p.id === activeStaffId) ?? null,
    [staffProfiles, activeStaffId]
  );

  const assignStaffIdForCreate =
    isSuperAdmin && activeStaffId
      ? activeStaffId
      : !isSuperAdmin
        ? currentStaffProfileId
        : null;

  const highlightId = activeStaffId ?? currentStaffProfileId ?? undefined;

  const showAllTab = isSuperAdmin;

  const scopedStatusCounts = useMemo(() => {
    if (staffStatusCountMap) {
      return countsForStaffProfile(staffStatusCountMap, activeStaffId);
    }
    return {
      pending: pendingTotalCount ?? 0,
      confirmed: confirmedTotalCount,
    };
  }, [
    staffStatusCountMap,
    activeStaffId,
    pendingTotalCount,
    confirmedTotalCount,
  ]);

  const statusListStaffSlug = activeProfile?.slug ?? null;

  return (
    <div className="space-y-2">
      {showStaffTabs && (
        <StaffPersonelTabs
          profiles={staffProfiles}
          activeStaffId={activeStaffId}
          onSelect={handleStaffSelect}
          showAllTab={showAllTab}
        />
      )}
      {showStaffTabs && activeProfile && (
        <p className="text-[11px] text-gray-600">
          <strong>{activeProfile.displayName}</strong> randevuları
          {!isSuperAdmin && activeStaffId !== currentStaffProfileId
            ? " (salt okunur)"
            : isSuperAdmin
              ? " — yeni randevular bu ustaya atanır"
              : " — ekleme ve düzenleme"}
        </p>
      )}
      {showStaffTabs && !activeStaffId && isSuperAdmin && (
        <p className="text-[11px] text-gray-600">
          Tüm usta randevuları. Usta seçerek filtreleyebilir veya yeni randevuyu
          ustaya atayabilirsiniz.
        </p>
      )}

      <AppointmentsCalendar
        initialAppointments={initialAppointments}
        initialCursor={initialCursor}
        initialLoadedRange={initialLoadedRange}
        services={services}
        isSuperAdmin={isSuperAdmin}
        currentStaffProfileId={currentStaffProfileId}
        multiAdminEnabled={multiAdminEnabled}
        highlightStaffProfileId={highlightId}
        filterStaffProfileId={activeStaffId}
        assignStaffIdForCreate={assignStaffIdForCreate}
        defaultView={defaultView}
        pinnedDailyPanel={pinnedDailyPanel || showStaffTabs}
        pendingTotalCount={scopedStatusCounts.pending}
        confirmedTotalCount={scopedStatusCounts.confirmed}
        statusListStaffSlug={statusListStaffSlug}
      />
    </div>
  );
}
