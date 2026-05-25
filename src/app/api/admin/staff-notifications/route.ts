import { NextResponse } from "next/server";
import { requireAppointmentAccess } from "@/lib/auth";
import {
  isPrismaSchemaMismatchError,
  SCHEMA_MISMATCH_MESSAGE,
} from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { getStaffUnreadCount } from "@/lib/staff-notifications";

export async function GET() {
  try {
    const session = await requireAppointmentAccess();
    const [items, unread] = await Promise.all([
      prisma.staffNotification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          body: true,
          link: true,
          appointmentId: true,
          readAt: true,
          createdAt: true,
        },
      }),
      getStaffUnreadCount(session.id),
    ]);
    return NextResponse.json({ items, unread });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json(
        { items: [], unread: 0, warning: SCHEMA_MISMATCH_MESSAGE },
        { status: 200 }
      );
    }
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAppointmentAccess();
    const body = (await req.json().catch(() => ({}))) as {
      ids?: string[];
      markAll?: boolean;
    };

    if (body.markAll) {
      await prisma.staffNotification.updateMany({
        where: { userId: session.id, readAt: null },
        data: { readAt: new Date() },
      });
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      await prisma.staffNotification.updateMany({
        where: {
          userId: session.id,
          id: { in: body.ids },
        },
        data: { readAt: new Date() },
      });
    } else {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const unread = await getStaffUnreadCount(session.id);
    return NextResponse.json({ ok: true, unread });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json(
        { ok: false, warning: SCHEMA_MISMATCH_MESSAGE },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}
