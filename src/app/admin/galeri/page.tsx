import { Suspense } from "react";
import { redirect } from "next/navigation";
import { GalleryAdmin } from "@/components/admin/GalleryAdmin";
import { StaffContentTabs } from "@/components/admin/StaffContentTabs";
import { getSession, isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveStaffContentScope } from "@/lib/staff-content-scope";
import { staffAdminProfileNameSelectFull } from "@/lib/staff-display-name";
import { toStaffProfileTabs } from "@/lib/staff-profile-tabs";
import { orderStaffProfilesForPanel } from "@/lib/staff-panel";
import { isMultiAdminEnabled, isSuperAdmin } from "@/lib/staff-admin";

export default async function AdminGaleriPage({
  searchParams,
}: {
  searchParams: Promise<{ personel?: string }>;
}) {
  const session = await getSession();
  if (!session || !isAdminSession(session)) redirect("/admin/giris");

  const { personel } = await searchParams;
  const superAdmin = isSuperAdmin(session.role);
  const multiAdmin = isMultiAdminEnabled();

  const scope = await resolveStaffContentScope(session, personel);

  const staffProfiles =
    superAdmin && multiAdmin
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

  const items = await prisma.galleryItem.findMany({
    where: scope.staffFilter,
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
  });

  const canUpload =
    !superAdmin || !!scope.staffProfileId || staffProfiles.length === 0;

  return (
    <div>
      <h1>Galeri</h1>
      {scope.staffDisplayName ? (
        <p className="mb-2 text-[11px] text-gray-600">
          <strong>{scope.staffDisplayName}</strong> galerisi
          {superAdmin && (
            <>
              {" "}
              ·{" "}
              <a
                href={`/galeri/${scope.staffSlug}`}
                className="admin-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Müşteri sayfası
              </a>
            </>
          )}
        </p>
      ) : (
        <p className="mb-2 text-[11px] text-gray-500">
          Resim ve video ekleyin. Gizli içerikler sitede listelenmez.
          {superAdmin && multiAdmin && staffProfiles.length > 0 && (
            <> Yükleme için üstten usta seçin.</>
          )}
        </p>
      )}

      {superAdmin && multiAdmin && staffProfiles.length > 0 && (
        <Suspense fallback={null}>
          <StaffContentTabs
            profiles={staffProfiles}
            basePath="/admin/galeri"
            showAllTab
          />
        </Suspense>
      )}

      <GalleryAdmin
        initialItems={items}
        personelSlug={scope.staffSlug}
        canUpload={canUpload}
        scopeLabel={scope.staffDisplayName}
      />
    </div>
  );
}
