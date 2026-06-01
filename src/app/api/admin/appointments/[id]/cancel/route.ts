import { NextResponse } from "next/server";
import {
  AdminForbiddenError,
  AdminUnauthorizedError,
  actorFromSession,
} from "@/lib/admin-permissions";
import { cancelAppointment } from "@/lib/appointment-approval";
import { requireAppointmentAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  appointmentWithMemberInclude,
  mapAdminAppointments,
} from "@/lib/admin-appointments-loader";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppointmentAccess();
    const { id } = await params;
    const result = await cancelAppointment(id, actorFromSession(session));
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    const apt = await prisma.appointment.findUnique({
      where: { id },
      include: appointmentWithMemberInclude,
    });
    if (!apt) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }
    const [mapped] = await mapAdminAppointments([apt]);
    return NextResponse.json({ appointment: mapped });
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (e instanceof AdminForbiddenError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
    return NextResponse.json({ error: "İptal edilemedi" }, { status: 400 });
  }
}
