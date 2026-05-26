import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSalonDisplaySettings } from "@/lib/salon-display";
import { getStaffDisplayName } from "@/lib/staff-display-name";
import { orderStaffProfilesForPanel } from "@/lib/staff-panel";
import { isMultiAdminEnabled } from "@/lib/staff-admin";
import { MobilePageTitle } from "@/components/mobile/MobilePageTitle";
import { RandevuForm } from "@/components/RandevuForm";

export default async function RandevuPage(props: {
  searchParams: Promise<{ hizmet?: string }>;
}) {
  const { hizmet: initialHizmetSlug } = await props.searchParams;
  const session = await getSession();
  const display = await getSalonDisplaySettings();
  const multiAdmin = isMultiAdminEnabled();
  const services = await prisma.service.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        durationMinutes: true,
        price: true,
        showPricePublic: true,
      },
  });

  const staffRaw = multiAdmin
    ? await prisma.staffAdminProfile.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          label: true,
          color: true,
          sortOrder: true,
          user: { select: { name: true } },
          services: { select: { serviceId: true } },
        },
      })
    : [];

  const staffOptions = orderStaffProfilesForPanel(staffRaw).map((s) => ({
    id: s.id,
    label: getStaffDisplayName(s),
    color: s.color,
  }));
  const staffServiceMap: Record<string, string[] | null> = {};
  for (const s of staffRaw) {
    staffServiceMap[s.id] =
      s.services.length === 0 ? null : s.services.map((x) => x.serviceId);
  }

  return (
    <div>
      <MobilePageTitle title="Online Randevu" />

      <section className="site-desktop-only relative overflow-hidden bg-gradient-to-br from-lotus-800 to-lotus-900 px-4 py-16 text-center text-white">
        <div className="hero-pattern absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-2xl">
          <h1 className="font-display text-5xl font-light">Online Randevu</h1>
          <p className="mt-4 text-rose-200">
            Ustanızı seçin, hizmet ve uygun saati belirleyin — birkaç dakikada tamamlayın.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-lg px-4 py-6 md:py-12">
        <Suspense
          fallback={
            <div className="card animate-pulse py-20 text-center text-gray-400">
              Yükleniyor...
            </div>
          }
        >
          <RandevuForm
            services={services}
            staffOptions={staffOptions}
            staffServiceMap={staffServiceMap}
            user={session ? { name: session.name, phone: session.phone } : null}
            initialSlug={initialHizmetSlug}
            showPrice={display.showPrice}
            showDuration={display.showDuration}
          />
        </Suspense>
      </div>
    </div>
  );
}
