import { ServicesAdmin } from "@/components/admin/ServicesAdmin";
import { prisma } from "@/lib/prisma";

export default async function AdminHizmetlerPage() {
  const [services, settings] = await Promise.all([
    prisma.service.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.salonSettings.findUnique({
      where: { id: "default" },
      select: { showServicePrice: true, showServiceDuration: true },
    }),
  ]);
  return (
    <div>
      <h1>Hizmetler</h1>
      <p className="mb-3 text-sm text-gray-500">
        Üstteki «Tümü» kutucukları tüm sitede süre/fiyatı açar veya kapatır. Her
        hizmet satırında «Site» ve «Ana sayfa» ile tek tek seçebilirsiniz; ana sayfa
        yalnızca öne çıkan hizmetlerde geçerlidir.
      </p>
      <ServicesAdmin
        initialServices={services}
        initialShowPrice={settings?.showServicePrice ?? true}
        initialShowDuration={settings?.showServiceDuration ?? true}
      />
    </div>
  );
}
