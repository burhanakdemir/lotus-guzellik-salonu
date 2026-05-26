import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppointmentsAdmin } from "@/components/admin/AppointmentsAdmin";
import {
  loadAdminAppointmentsData,
  mapAdminAppointments,
} from "@/lib/admin-appointments-loader";
import {
  countsForStaffProfile,
  loadAdminAppointmentStatusCounts,
  loadStaffStatusCountMap,
} from "@/lib/admin-appointment-status";
import { getSession, isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { staffAdminProfileNameSelectFull } from "@/lib/staff-display-name";
import { toStaffProfileTabs } from "@/lib/staff-profile-tabs";
import { orderStaffProfilesForPanel } from "@/lib/staff-panel";
import { isMultiAdminEnabled, isSuperAdmin } from "@/lib/staff-admin";

export default async function AdminRandevularPage({
  searchParams,
}: {
  searchParams: Promise<{ personel?: string }>;
}) {
  const session = await getSession();
  if (!session || !isAdminSession(session)) redirect("/admin/giris");

  const { personel: personelSlug } = await searchParams;
  const multiAdmin = isMultiAdminEnabled();
  const superAdmin = isSuperAdmin(session.role);

  const staffProfiles = multiAdmin
    ? toStaffProfileTabs(
        orderStaffProfilesForPanel(
          await prisma.staffAdminProfile.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: staffAdminProfileNameSelectFull,
          })
        )
      )
    : [];

  let initialActiveStaffId: string | null = null;
  if (personelSlug) {
    initialActiveStaffId =
      staffProfiles.find((p) => p.slug === personelSlug)?.id ?? null;
  } else if (!superAdmin && session.staffProfileId) {
    initialActiveStaffId = session.staffProfileId;
  }

  const [{ today, monthRange, appointments, services }, staffStatusCountMap, scopedCounts] =
    await Promise.all([
      loadAdminAppointmentsData(session),
      superAdmin && multiAdmin
        ? loadStaffStatusCountMap()
        : Promise.resolve(null),
      loadAdminAppointmentStatusCounts(session, initialActiveStaffId),
    ]);

  const tabCounts =
    staffStatusCountMap && initialActiveStaffId
      ? countsForStaffProfile(staffStatusCountMap, initialActiveStaffId)
      : {
          pending: scopedCounts.pendingCount,
          confirmed: scopedCounts.confirmedCount,
        };

  return (
    <div>
      <h1>Randevular</h1>
      <p className="mb-2 text-[11px] text-gray-500">
        {multiAdmin
          ? "Üstten usta seçin; onay bekleyen ve onaylı listeler seçilen ustaya göre güncellenir."
          : "Tüm randevular görüntülenir."}
      </p>
      <Suspense fallback={<p className="text-[11px] text-gray-500">Yükleniyor…</p>}>
        <AppointmentsAdmin
          initialAppointments={await mapAdminAppointments(appointments)}
          initialCursor={today}
          initialLoadedRange={{ from: monthRange.from, to: monthRange.to }}
          services={services}
          isSuperAdmin={superAdmin}
          currentStaffProfileId={session.staffProfileId ?? null}
          multiAdminEnabled={multiAdmin}
          staffProfiles={staffProfiles}
          initialActiveStaffId={initialActiveStaffId}
          defaultView={multiAdmin ? "day" : undefined}
          pinnedDailyPanel={multiAdmin || !superAdmin}
          pendingTotalCount={tabCounts.pending}
          confirmedTotalCount={tabCounts.confirmed}
          staffStatusCountMap={staffStatusCountMap}
        />
      </Suspense>
    </div>
  );
}
