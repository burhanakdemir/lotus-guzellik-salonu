import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDashboardPanels } from "@/components/admin/AdminDashboardPanels";
import { mapAdminAppointments } from "@/lib/admin-appointments-loader";
import { getSession, isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderStaffProfilesForPanel } from "@/lib/staff-panel";
import { todayString } from "@/lib/timezone";
import { isMultiAdminEnabled, isSuperAdmin } from "@/lib/staff-admin";
import { getSalonDaySchedule } from "@/lib/salon-schedule";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || !isAdminSession(session)) redirect("/admin/giris");

  const today = todayString();
  const superAdmin = isSuperAdmin(session.role);
  const multiAdmin = isMultiAdminEnabled();

  const staffProfiles = multiAdmin
    ? orderStaffProfilesForPanel(
        await prisma.staffAdminProfile.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            slug: true,
            label: true,
            color: true,
            sortOrder: true,
          },
        })
      )
    : [];

  const staffFilter =
    !superAdmin && session.staffProfileId
      ? { assignedStaffId: session.staffProfileId }
      : {};

  const pendingWhere = {
    status: "PENDING" as "PENDING",
    ...staffFilter,
  };

  const todayWhere = {
    date: today,
    status: { in: ["PENDING", "CONFIRMED"] as ("PENDING" | "CONFIRMED")[] },
    ...staffFilter,
  };

  const [
    todayAppointments,
    memberCount,
    activePromo,
    weekAppointments,
    pendingAppointments,
    services,
    daySchedule,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: todayWhere,
      include: {
        service: true,
        assignedStaff: {
          select: { id: true, slug: true, label: true, color: true },
        },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.user.count({ where: { role: "MEMBER", isActive: true } }),
    prisma.promotion.findFirst({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    }),
    prisma.appointment.count({
      where: {
        date: { gte: today },
        status: { in: ["PENDING", "CONFIRMED"] },
        ...staffFilter,
      },
    }),
    prisma.appointment.findMany({
      where: pendingWhere,
      include: {
        service: true,
        assignedStaff: {
          select: { id: true, slug: true, label: true, color: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 100,
    }),
    prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, durationMinutes: true },
    }),
    getSalonDaySchedule(today),
  ]);

  let initialActiveStaffId: string | null = null;
  if (!superAdmin && session.staffProfileId) {
    initialActiveStaffId = session.staffProfileId;
  }

  return (
    <div>
      <h1>Özet</h1>

      <AdminDashboardPanels
        today={today}
        initialPending={mapAdminAppointments(pendingAppointments)}
        initialToday={mapAdminAppointments(todayAppointments)}
        services={services}
        staffProfiles={staffProfiles}
        initialActiveStaffId={initialActiveStaffId}
        isSuperAdmin={superAdmin}
        currentStaffProfileId={session.staffProfileId ?? null}
        multiAdminEnabled={multiAdmin}
        initialDaySchedule={daySchedule}
        memberCount={memberCount}
        weekAppointments={weekAppointments}
      />

      {superAdmin && activePromo && (
        <div className="card admin-promo-card">
          <p className="admin-stat-card__label">Kampanya</p>
          <p className="admin-promo-card__title">{activePromo.title}</p>
          <Link href="/admin/kampanyalar" className="admin-link">
            →
          </Link>
        </div>
      )}
    </div>
  );
}
