import { NextResponse } from "next/server";
import { AdminUnauthorizedError } from "@/lib/admin-permissions";
import { requireAppointmentAccess } from "@/lib/auth";
import { getAvailableSlots } from "@/lib/slots";
import { isSuperAdmin } from "@/lib/staff-admin";
import { z } from "zod";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string(),
  assignedStaffId: z.string().optional(),
  excludeAppointmentId: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await requireAppointmentAccess();
    const { searchParams } = new URL(req.url);
    const parsed = schema.parse({
      date: searchParams.get("date"),
      serviceId: searchParams.get("serviceId"),
      assignedStaffId: searchParams.get("assignedStaffId") || undefined,
      excludeAppointmentId:
        searchParams.get("excludeAppointmentId") || undefined,
    });

    // Staff admin yalnızca kendi ustası için slot görebilir.
    const superAdmin = isSuperAdmin(session.role);
    const assignedStaffIdForSlots = superAdmin
      ? parsed.assignedStaffId
      : session.staffProfileId ?? undefined;

    const result = await getAvailableSlots(
      parsed.date,
      parsed.serviceId,
      undefined,
      assignedStaffIdForSlots,
      parsed.excludeAppointmentId
    );
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    return NextResponse.json(
      { slots: [], error: "Geçersiz parametre." },
      { status: 400 }
    );
  }
}
