"use client";

import type { ReactNode } from "react";
import { DailyScheduleGrid } from "@/components/admin/DailyScheduleGrid";
import type { SalonDaySchedule } from "@/lib/salon-schedule";
import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import type { AdminServiceOption } from "@/components/admin/AppointmentsAdmin";
import { navigateCursor, parseDateKey, toDateKey } from "@/lib/calendar-dates";
import { todayString } from "@/lib/timezone";

type Props = {
  cursor: Date;
  onCursorChange: (date: Date) => void;
  appointments: CalendarAppointment[];
  services: AdminServiceOption[];
  canCreate: boolean;
  canEdit: (apt: CalendarAppointment) => boolean;
  highlightStaffProfileId?: string;
  onSelect: (a: CalendarAppointment) => void;
  onSlotClick: (startTime: string) => void;
  onUnblockSlot?: (blockId: string) => void | Promise<void>;
  scheduleStaffId?: string | null;
  scheduleRefreshKey?: number;
  hint?: ReactNode;
  initialSchedule?: SalonDaySchedule | null;
};

export function DailyAppointmentsCard({
  cursor,
  onCursorChange,
  appointments,
  services,
  canCreate,
  canEdit,
  highlightStaffProfileId,
  onSelect,
  onSlotClick,
  onUnblockSlot,
  scheduleStaffId,
  scheduleRefreshKey,
  hint,
  initialSchedule = null,
}: Props) {
  const dateKey = toDateKey(cursor);

  return (
    <div className="card space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="!mb-0 text-sm font-semibold text-lotus-800">
          Günlük randevular
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-secondary !px-2 !py-0.5 !text-[10px]"
            onClick={() =>
              onCursorChange(navigateCursor("day", cursor, -1))
            }
          >
            ‹ Gün
          </button>
          <button
            type="button"
            className="btn-secondary !px-2 !py-0.5 !text-[10px]"
            onClick={() => onCursorChange(parseDateKey(todayString()))}
          >
            Bugün
          </button>
          <button
            type="button"
            className="btn-secondary !px-2 !py-0.5 !text-[10px]"
            onClick={() => onCursorChange(navigateCursor("day", cursor, 1))}
          >
            Gün ›
          </button>
        </div>
      </div>
      {hint}
      <DailyScheduleGrid
        cursor={cursor}
        dateKey={dateKey}
        appointments={appointments}
        services={services}
        canCreate={canCreate}
        canEdit={canEdit}
        highlightStaffProfileId={highlightStaffProfileId}
        onSelect={onSelect}
        onSlotClick={onSlotClick}
        onUnblockSlot={onUnblockSlot}
        scheduleStaffId={scheduleStaffId}
        scheduleRefreshKey={scheduleRefreshKey}
        initialSchedule={
          initialSchedule?.date === dateKey ? initialSchedule : null
        }
      />
    </div>
  );
}
