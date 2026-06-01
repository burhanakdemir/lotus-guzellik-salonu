import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

/** Aynı gün için bekleyen/onaylı randevu var mı (müşteri tarafı) */
export async function hasActiveAppointmentOnDate(
  phone: string,
  date: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10) return false;

  const count = await prisma.appointment.count({
    where: {
      date,
      phone: normalized,
      status: { in: ["PENDING", "CONFIRMED"] },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
  });
  return count > 0;
}
