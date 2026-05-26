import Link from "next/link";
import { redirect } from "next/navigation";
import { AppointmentStatusList } from "@/components/admin/AppointmentStatusList";
import { mapAdminAppointments } from "@/lib/admin-appointments-loader";
import {
  loadAdminAppointmentStatusCounts,
  loadAppointmentsByStatus,
  resolveStaffScopeBySlug,
} from "@/lib/admin-appointment-status";
import { getSession, isAdminSession } from "@/lib/auth";
import { isMultiAdminEnabled, isSuperAdmin } from "@/lib/staff-admin";

export default async function OnayBekleyenRandevularPage({
  searchParams,
}: {
  searchParams: Promise<{ personel?: string }>;
}) {
  const session = await getSession();
  if (!session || !isAdminSession(session)) redirect("/admin/giris");

  const { personel } = await searchParams;
  const scope = await resolveStaffScopeBySlug(session, personel);
  const [{ pendingCount }, pendingRows] = await Promise.all([
    loadAdminAppointmentStatusCounts(session, scope.staffProfileId),
    loadAppointmentsByStatus("PENDING", scope.staffFilter),
  ]);

  const superAdmin = isSuperAdmin(session.role);
  const multiAdmin = isMultiAdminEnabled();
  const backHref = scope.staffSlug
    ? `/admin/randevular?personel=${encodeURIComponent(scope.staffSlug)}`
    : "/admin/randevular";

  return (
    <div>
      <h1>
        {scope.staffDisplayName
          ? `${scope.staffDisplayName} — onay bekleyen`
          : "Onay bekleyen randevular"}
      </h1>
      <p className="mb-2 text-[11px] text-gray-500">
        Toplam{" "}
        <span className="font-semibold text-amber-900">{pendingCount}</span>{" "}
        randevu · tarih ve saate göre sıralı
      </p>
      <p className="mb-2 text-[11px] text-gray-500">
        <Link href={backHref} className="admin-link">
          Randevular
        </Link>
        {superAdmin && (
          <>
            {" · "}
            <Link href="/admin" className="admin-link">
              Özet
            </Link>
          </>
        )}
      </p>
      <AppointmentStatusList
        appointments={await mapAdminAppointments(pendingRows)}
        variant="pending"
        isSuperAdmin={superAdmin}
        currentStaffProfileId={session.staffProfileId ?? null}
        multiAdminEnabled={multiAdmin}
        backHref={backHref}
      />
    </div>
  );
}
