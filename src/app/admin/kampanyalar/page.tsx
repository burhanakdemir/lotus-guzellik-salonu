import { PromotionsAdmin } from "@/components/admin/PromotionsAdmin";
import { prisma } from "@/lib/prisma";

export default async function AdminKampanyalarPage() {
  const [promotions, services] = await Promise.all([
    prisma.promotion.findMany({
      include: { services: { include: { service: true } } },
      orderBy: { startDate: "desc" },
    }),
    prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <h1>Kampanyalar</h1>
      <PromotionsAdmin initialPromotions={promotions} services={services} />
    </div>
  );
}
