import { GalleryGrid } from "@/components/GalleryGrid";
import { MobilePageTitle } from "@/components/mobile/MobilePageTitle";
import { StaffPublicPicker } from "@/components/public/StaffPublicPicker";
import { prisma } from "@/lib/prisma";
import { loadActiveStaffForPublic } from "@/lib/staff-content-scope";

export const metadata = {
  title: "Galeri | LOTUS Güzellik Salonu",
  description: "Salonumuzdan çalışmalar ve videolar.",
};

export default async function GaleriPage() {
  const [staff, legacyItems] = await Promise.all([
    loadActiveStaffForPublic(),
    prisma.galleryItem.findMany({
      where: { isActive: true, staffProfileId: null },
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        mediaType: true,
        mediaUrl: true,
      },
    }),
  ]);

  return (
    <div>
      <MobilePageTitle title="Galeri" />

      <section className="site-desktop-only relative overflow-hidden bg-gradient-to-br from-lotus-800 via-lotus-700 to-lotus-600 px-4 py-12 text-center text-white md:py-16">
        <div className="hero-pattern absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-lotus-center">
            Çalışmalarımız
          </p>
          <h1 className="font-display mt-3 text-4xl font-light md:text-5xl">Galeri</h1>
          <p className="mt-4 text-rose-100/90">
            Ustanıza göre galerileri inceleyin
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 md:py-16 lg:px-8">
        <StaffPublicPicker staff={staff} basePath="/galeri" title="Usta galerileri" />

        {legacyItems.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display mb-4 text-center text-2xl text-lotus-800">
              Salon galerisi
            </h2>
            <div className="mobile-gallery-grid md:contents">
              <GalleryGrid items={legacyItems} />
            </div>
          </section>
        )}

        {staff.length === 0 && legacyItems.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            Henüz galeri içeriği eklenmemiş.
          </p>
        )}
      </div>
    </div>
  );
}
