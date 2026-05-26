import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryGrid } from "@/components/GalleryGrid";
import { MobilePageTitle } from "@/components/mobile/MobilePageTitle";
import { prisma } from "@/lib/prisma";
import { findActiveStaffBySlug } from "@/lib/staff-content-scope";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const staff = await findActiveStaffBySlug(slug);
  if (!staff) return { title: "Galeri | LOTUS" };
  return {
    title: `${staff.label} — Galeri | LOTUS Güzellik Salonu`,
    description: `${staff.label} çalışmaları ve videoları.`,
  };
}

export default async function StaffGaleriPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const staff = await findActiveStaffBySlug(slug);
  if (!staff) notFound();

  const items = await prisma.galleryItem.findMany({
    where: { isActive: true, staffProfileId: staff.id },
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      mediaType: true,
      mediaUrl: true,
    },
  });

  return (
    <div>
      <MobilePageTitle title={`${staff.label} — Galeri`} />

      <section className="site-desktop-only relative overflow-hidden bg-gradient-to-br from-lotus-800 via-lotus-700 to-lotus-600 px-4 py-12 text-center text-white md:py-16">
        <div className="hero-pattern absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-lotus-center">
            Usta galerisi
          </p>
          <h1 className="font-display mt-3 text-4xl font-light md:text-5xl">
            {staff.label}
          </h1>
          <p className="mt-4 text-rose-100/90">Galeri</p>
          <p className="mt-4">
            <Link href="/galeri" className="text-sm text-rose-100 underline hover:text-white">
              ← Tüm ustalar
            </Link>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 md:py-16 lg:px-8">
        {items.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            Bu usta için henüz galeri içeriği yok.
          </p>
        ) : (
          <div className="mobile-gallery-grid md:contents">
            <GalleryGrid items={items} />
          </div>
        )}
      </div>
    </div>
  );
}
