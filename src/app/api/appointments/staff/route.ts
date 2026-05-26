import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffDisplayName } from "@/lib/staff-display-name";
import { orderStaffProfilesForPanel } from "@/lib/staff-panel";
import { getStaffIdsEligibleForService } from "@/lib/staff-services";
import { isMultiAdminEnabled } from "@/lib/staff-admin";

/** Online randevu — hizmete göre uygun ustalar */
export async function GET(req: Request) {
  if (!isMultiAdminEnabled()) {
    return NextResponse.json({ staff: [] });
  }

  const serviceId = new URL(req.url).searchParams.get("serviceId");

  const profiles = await prisma.staffAdminProfile.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      label: true,
      color: true,
      sortOrder: true,
      user: { select: { name: true } },
    },
  });

  let filtered = profiles;
  if (serviceId) {
    const eligible = new Set(await getStaffIdsEligibleForService(serviceId));
    filtered = profiles.filter((p) => eligible.has(p.id));
  }

  return NextResponse.json({
    staff: orderStaffProfilesForPanel(filtered).map((p) => ({
      id: p.id,
      label: getStaffDisplayName(p),
      color: p.color,
    })),
  });
}
