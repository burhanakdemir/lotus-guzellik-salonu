import { NextResponse } from "next/server";
import { AdminUnauthorizedError } from "@/lib/admin-permissions";
import { resolveStaffContentScope } from "@/lib/staff-content-scope";
import { requireStaffContentAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await requireStaffContentAccess();
    const personel = new URL(req.url).searchParams.get("personel");
    const scope = await resolveStaffContentScope(session, personel);

    const reviews = await prisma.customerReview.findMany({
      where: scope.staffFilter,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
    return NextResponse.json(reviews);
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}
