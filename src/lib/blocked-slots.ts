import { prisma } from "@/lib/prisma";
import { timeToMinutes } from "@/lib/time-format";

export type BlockedTimeSlotRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedStaffId: string | null;
  reason: string | null;
};

export function timeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return (
    timeToMinutes(startA) < timeToMinutes(endB) &&
    timeToMinutes(endA) > timeToMinutes(startB)
  );
}

/** Global (assignedStaffId null) veya ilgili ustaya ait blok */
export function blockAppliesToStaff(
  block: { assignedStaffId: string | null },
  staffId?: string | null
): boolean {
  if (!block.assignedStaffId) return true;
  if (!staffId) return false;
  return block.assignedStaffId === staffId;
}

export async function getBlockedSlotsForDate(
  date: string,
  staffId?: string | null
): Promise<BlockedTimeSlotRow[]> {
  try {
    const rows = await prisma.blockedTimeSlot.findMany({
      where: { date },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        assignedStaffId: true,
        reason: true,
      },
    });
    if (!staffId) return rows;
    return rows.filter((b) => blockAppliesToStaff(b, staffId));
  } catch {
    return [];
  }
}

export function slotStartIsBlocked(
  slotStart: string,
  slotEnd: string,
  blocks: BlockedTimeSlotRow[]
): BlockedTimeSlotRow | undefined {
  return blocks.find((b) =>
    timeRangesOverlap(slotStart, slotEnd, b.startTime, b.endTime)
  );
}
