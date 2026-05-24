import { GalleryAdmin } from "@/components/admin/GalleryAdmin";
import { prisma } from "@/lib/prisma";

export default async function AdminGaleriPage() {
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1>Galeri</h1>
      <p className="mb-3 text-sm text-gray-500">
        Resim ve video ekleyin. Başlık ve kısa açıklama müşteri galeri sayfasında
        görünür. Gizli içerikler sitede listelenmez.
      </p>
      <GalleryAdmin initialItems={items} />
    </div>
  );
}
