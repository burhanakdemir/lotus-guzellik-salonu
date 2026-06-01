import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfirmedAppointmentsList } from "@/components/admin/ConfirmedAppointmentsList";
import { mapAdminAppointments } from "@/lib/admin-appointments-loader";
import {
  loadAdminAppointmentStatusCounts,
  loadAppointmentsByStatus,
  resolveStaffScopeBySlug,
} from "@/lib/admin-appointment-status";
import { getSession, isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStaffDisplayName,
  staffAdminProfileNameSelectFull,
} from "@/lib/staff-display-name";
import { isMultiAdminEnabled, isSuperAdmin } from "@/lib/staff-admin";

export default async function OnayliRandevularPage(props: {
  searchParams: Promise<{ personel?: string }>;
}) {
  const session = await getSession();
  if (!session || !isAdminSession(session)) redirect("/admin/giris");

  const { personel } = await props.searchParams;
  const scope = await resolveStaffScopeBySlug(session, personel);
  const [{ confirmedCount }, confirmedRows] = await Promise.all([
    loadAdminAppointmentStatusCounts(session, scope.staffProfileId),
    loadAppointmentsByStatus("CONFIRMED", scope.staffFilter),
  ]);

  const superAdmin = isSuperAdmin(session.role);
  const multiAdmin = isMultiAdminEnabled();
  const backHref = scope.staffSlug
    ? `/admin/randevular?personel=${encodeURIComponent(scope.staffSlug)}`
    : "/admin/randevular";

  let staffBannerName = scope.staffDisplayName;
  if (!staffBannerName && session.staffProfileId) {
    const profile = await prisma.staffAdminProfile.findUnique({
      where: { id: session.staffProfileId },
      select: staffAdminProfileNameSelectFull,
    });
    if (profile) staffBannerName = getStaffDisplayName(profile);
  }

  return (
    <div>
      <h1>
        {scope.staffDisplayName
          ? `${scope.staffDisplayName} — onaylı randevular`
          : "Onaylı randevularınız"}
      </h1>
      <p className="mb-2 text-[11px] text-gray-500">
        Toplam{" "}
        <span className="font-semibold text-lotus-800">{confirmedCount}</span>{" "}
        onaylı randevu · gelecek / geçmiş sekmeleri, aynı tablo düzeni
      </p>
      <nav className="admin-page-nav mb-3" aria-label="Sayfa gezintisi">
        <Link href={backHref} className="admin-nav-btn">
          Randevular
        </Link>
        {superAdmin && (
          <Link href="/admin" className="admin-nav-btn">
            Özet
          </Link>
        )}
      </nav>
      <ConfirmedAppointmentsList
        appointments={await mapAdminAppointments(confirmedRows)}
        showStaff={multiAdmin}
        staffBannerName={staffBannerName}
        backHref={backHref}
        isSuperAdmin={superAdmin}
        currentStaffProfileId={session.staffProfileId ?? null}
        multiAdminEnabled={multiAdmin}
      />
    </div>
  );
}
