import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const reviews = await prisma.customerReview.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}
