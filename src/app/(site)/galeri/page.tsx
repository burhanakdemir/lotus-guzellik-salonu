import { GalleryGrid } from "@/components/GalleryGrid";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Galeri | LOTUS Güzellik Salonu",
  description: "Salonumuzdan çalışmalar ve videolar.",
};

export default async function GaleriPage() {
  const items = await prisma.galleryItem.findMany({
    where: { isActive: true },
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
      <section className="relative overflow-hidden bg-gradient-to-br from-lotus-800 via-lotus-700 to-lotus-600 px-4 py-12 text-center text-white md:py-16">
        <div className="hero-pattern absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-lotus-center">
            Çalışmalarımız
          </p>
          <h1 className="font-display mt-3 text-4xl font-light md:text-5xl">Galeri</h1>
          <p className="mt-4 text-rose-100/90">
            Salonumuzdan seçilmiş uygulamalar ve videolar
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <GalleryGrid items={items} />
      </div>
    </div>
  );
}
