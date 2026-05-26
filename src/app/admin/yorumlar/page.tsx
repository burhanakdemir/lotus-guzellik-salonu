import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ReviewsAdmin } from "@/components/admin/ReviewsAdmin";
import { StaffContentTabs } from "@/components/admin/StaffContentTabs";
import { getSession, isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveStaffContentScope } from "@/lib/staff-content-scope";
import { staffAdminProfileNameSelectFull } from "@/lib/staff-display-name";
import { toStaffProfileTabs } from "@/lib/staff-profile-tabs";
import { orderStaffProfilesForPanel } from "@/lib/staff-panel";
import { isMultiAdminEnabled, isSuperAdmin } from "@/lib/staff-admin";

export default async function AdminYorumlarPage({
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

  const reviews = await prisma.customerReview.findMany({
    where: scope.staffFilter,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
    },
  });

  const initialReviews = reviews.map((r) => ({
    id: r.id,
    content: r.content,
    imageUrls: r.imageUrls,
    status: r.status,
    guestName: r.guestName,
    guestPhone: r.guestPhone,
    guestEmail: r.guestEmail,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
  }));

  return (
    <div>
      <h1>Yorumlar</h1>
      {scope.staffDisplayName ? (
        <p className="mb-2 text-[11px] text-gray-600">
          <strong>{scope.staffDisplayName}</strong> yorumları
          {superAdmin && (
            <>
              {" "}
              ·{" "}
              <a
                href={`/yorumlar/${scope.staffSlug}`}
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
          Müşteri yorumlarını onaylayın, düzenleyin veya silin. Yalnızca onaylanan
          yorumlar sitede görünür.
          {superAdmin && multiAdmin && staffProfiles.length > 0 && (
            <> Filtrelemek için üstten usta seçin.</>
          )}
        </p>
      )}

      {superAdmin && multiAdmin && staffProfiles.length > 0 && (
        <Suspense fallback={null}>
          <StaffContentTabs
            profiles={staffProfiles}
            basePath="/admin/yorumlar"
            showAllTab
          />
        </Suspense>
      )}

      <ReviewsAdmin
        initialReviews={initialReviews}
        personelSlug={scope.staffSlug}
        scopeLabel={scope.staffDisplayName}
      />
    </div>
  );
}
