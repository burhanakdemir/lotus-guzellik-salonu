import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
  return NextResponse.json(items);
}
