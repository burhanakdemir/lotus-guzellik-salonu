import { prisma } from "@/lib/prisma";
import { safeDbQuery } from "@/lib/db-safe";

export type SalonDisplaySettings = {
  showPrice: boolean;
  showDuration: boolean;
};

export async function getSalonDisplaySettings(): Promise<SalonDisplaySettings> {
  const settings = await safeDbQuery(
    () =>
      prisma.salonSettings.findUnique({
        where: { id: "default" },
        select: { showServicePrice: true, showServiceDuration: true },
      }),
    null
  );
  return {
    showPrice: settings?.showServicePrice ?? true,
    showDuration: settings?.showServiceDuration ?? true,
  };
}
