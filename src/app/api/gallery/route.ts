import { NextResponse } from "next/server";
import { findActiveStaffBySlug } from "@/lib/staff-content-scope";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const staffSlug = new URL(req.url).searchParams.get("staffSlug");
  let staffProfileId: string | null | undefined = undefined;

  if (staffSlug) {
    const staff = await findActiveStaffBySlug(staffSlug);
    if (!staff) {
      return NextResponse.json([]);
    }
    staffProfileId = staff.id;
  }

  const items = await prisma.galleryItem.findMany({
    where: {
      isActive: true,
      ...(staffProfileId !== undefined
        ? { staffProfileId }
        : {}),
    },
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      mediaType: true,
      mediaUrl: true,
    },
  });
  return NextResponse.json(items);
}
