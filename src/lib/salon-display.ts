import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SALON_SETTINGS, safeDbQuery } from "@/lib/db-safe";

export type SalonDisplaySettings = {
  showPrice: boolean;
  showDuration: boolean;
};

export const getSalonDisplaySettings = cache(async (): Promise<SalonDisplaySettings> => {
  const settings = await safeDbQuery(
    () =>
      prisma.salonSettings.findUnique({
        where: { id: "default" },
        select: { showServicePrice: true, showServiceDuration: true },
      }),
    null
  );
  const fallback = DEFAULT_SALON_SETTINGS;
  return {
    showPrice: settings?.showServicePrice ?? fallback.showServicePrice,
    showDuration: settings?.showServiceDuration ?? fallback.showServiceDuration,
  };
});
