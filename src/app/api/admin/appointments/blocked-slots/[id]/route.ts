import { NextResponse } from "next/server";
import { AdminUnauthorizedError } from "@/lib/admin-permissions";
import { requireAppointmentAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffAdmin, isSuperAdmin } from "@/lib/staff-admin";

type RouteCtx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: RouteCtx) {
  try {
    const session = await requireAppointmentAccess();
    const { id } = await ctx.params;

    const block = await prisma.blockedTimeSlot.findUnique({ where: { id } });
    if (!block) {
      return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
    }

    if (isStaffAdmin(session.role) && !isSuperAdmin(session.role)) {
      if (!block.assignedStaffId) {
        return NextResponse.json(
          { error: "Salon geneli kapatmayı yalnızca süper admin açabilir." },
          { status: 403 }
        );
      }
      if (block.assignedStaffId !== session.staffProfileId) {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
      }
    }

    await prisma.blockedTimeSlot.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
