import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/slots";
import { z } from "zod";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string(),
  phone: z.string().optional(),
  assignedStaffId: z.string().optional(),
  excludeAppointmentId: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  try {
    const parsed = schema.parse({
      date: searchParams.get("date"),
      serviceId: searchParams.get("serviceId"),
      phone: searchParams.get("phone") || undefined,
      assignedStaffId: searchParams.get("assignedStaffId") || undefined,
      excludeAppointmentId: searchParams.get("excludeAppointmentId") || undefined,
    });
    const result = await getAvailableSlots(
      parsed.date,
      parsed.serviceId,
      parsed.phone,
      parsed.assignedStaffId,
      parsed.excludeAppointmentId
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ slots: [], error: "Geçersiz parametre." }, { status: 400 });
  }
}
