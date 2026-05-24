import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      description: true,
      durationMinutes: true,
      price: true,
      imageUrl: true,
    },
  });
  return NextResponse.json(services);
}
