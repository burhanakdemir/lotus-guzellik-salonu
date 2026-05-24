import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppointmentsAdmin } from "@/components/admin/AppointmentsAdmin";
import {
  loadAdminAppointmentsData,
  mapAdminAppointments,
} from "@/lib/admin-appointments-loader";
import { getSession, isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    ? orderStaffProfilesForPanel(
        await prisma.staffAdminProfile.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            slug: true,
            label: true,
            color: true,
            sortOrder: true,
          },
        })
      )
    : [];

  let initialActiveStaffId: string | null = null;
  if (personelSlug) {
    initialActiveStaffId =
      staffProfiles.find((p) => p.slug === personelSlug)?.id ?? null;
  } else if (!superAdmin && session.staffProfileId) {
    initialActiveStaffId = session.staffProfileId;
  }

  const { today, appointments, services } = await loadAdminAppointmentsData();

  return (
    <div>
      <h1>Randevular</h1>
      <p className="mb-2 text-[11px] text-gray-500">
        {multiAdmin
          ? "Üstten usta seçin; takvim ve günlük saatler seçilen ustaya göre filtrelenir."
          : "Tüm randevular görüntülenir."}
      </p>
      <Suspense fallback={<p className="text-[11px] text-gray-500">Yükleniyor…</p>}>
        <AppointmentsAdmin
          initialAppointments={mapAdminAppointments(appointments)}
          initialCursor={today}
          services={services}
          isSuperAdmin={superAdmin}
          currentStaffProfileId={session.staffProfileId ?? null}
          multiAdminEnabled={multiAdmin}
          staffProfiles={staffProfiles}
          initialActiveStaffId={initialActiveStaffId}
          defaultView={multiAdmin ? "day" : undefined}
          pinnedDailyPanel={multiAdmin}
        />
      </Suspense>
    </div>
  );
}
