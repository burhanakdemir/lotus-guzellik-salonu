import type { CalendarAppointment } from "@/components/admin/AppointmentsCalendar";
import {
  formatAdminAppointmentLine,
  getAdminAppointmentDisplay,
  getAppointmentMemberDisplayName,
} from "@/lib/admin-appointment-line";

export function AdminAppointmentBlock({
  apt,
  showStaff = false,
  headlineClassName = "text-[11px] font-semibold text-lotus-800",
  rowClassName = "text-[10px] text-gray-600",
}: {
  apt: Pick<
    CalendarAppointment,
    | "name"
    | "user"
    | "phone"
    | "date"
    | "startTime"
    | "endTime"
    | "service"
    | "assignedStaff"
    | "assignedStaffId"
  >;
  showStaff?: boolean;
  headlineClassName?: string;
  rowClassName?: string;
}) {
  const d = getAdminAppointmentDisplay(apt, { showStaff });
  const memberName = getAppointmentMemberDisplayName(apt);
  const showHeadline = d.headline !== memberName;

  return (
    <div
      className="apt-appointment-block min-w-0"
      title={formatAdminAppointmentLine(apt, { showStaff })}
    >
      {showHeadline && (
        <p className={`apt-appointment-block__headline ${headlineClassName}`}>
          {d.headline}
        </p>
      )}
      <p className={`apt-appointment-block__row ${rowClassName}`}>
        {d.detailsRow}
      </p>
    </div>
  );
}
