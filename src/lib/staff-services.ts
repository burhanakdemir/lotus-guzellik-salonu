import { prisma } from "@/lib/prisma";

/** Bu ustada kayıtlı hizmet kısıtı var mı? */
export async function staffHasServiceRestrictions(staffId: string): Promise<boolean> {
  const count = await prisma.staffService.count({ where: { staffId } });
  return count > 0;
}

/** null = tüm hizmetler */
export async function getServiceIdsForStaff(
  staffId: string
): Promise<string[] | null> {
  const rows = await prisma.staffService.findMany({
    where: { staffId },
    select: { serviceId: true },
  });
  if (rows.length === 0) return null;
  return rows.map((r) => r.serviceId);
}

export async function staffCanPerformService(
  staffId: string,
  serviceId: string
): Promise<boolean> {
  const allowed = await getServiceIdsForStaff(staffId);
  if (allowed === null) return true;
  return allowed.includes(serviceId);
}

/** Verilen hizmeti yapabilen aktif usta id'leri */
export async function getStaffIdsEligibleForService(
  serviceId: string
): Promise<string[]> {
  const [activeStaff, restrictedStaffIds, linked] = await Promise.all([
    prisma.staffAdminProfile.findMany({
      where: { isActive: true },
      select: { id: true },
    }),
    prisma.staffService
      .findMany({ select: { staffId: true }, distinct: ["staffId"] })
      .then((rows) => new Set(rows.map((r) => r.staffId))),
    prisma.staffService.findMany({
      where: { serviceId },
      select: { staffId: true },
    }),
  ]);

  const linkedSet = new Set(linked.map((l) => l.staffId));
  return activeStaff
    .filter((s) => !restrictedStaffIds.has(s.id) || linkedSet.has(s.id))
    .map((s) => s.id);
}

export async function setStaffServices(
  staffId: string,
  serviceIds: string[]
): Promise<void> {
  const unique = [...new Set(serviceIds)];
  await prisma.$transaction([
    prisma.staffService.deleteMany({ where: { staffId } }),
    ...(unique.length > 0
      ? [
          prisma.staffService.createMany({
            data: unique.map((serviceId) => ({ staffId, serviceId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
}
