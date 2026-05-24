import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { todayString } from "@/lib/timezone";

export default async function AdminDashboard() {
  const today = todayString();
  const [todayAppointments, memberCount, activePromo, weekAppointments] =
    await Promise.all([
      prisma.appointment.findMany({
        where: { date: today, status: { in: ["PENDING", "CONFIRMED"] } },
        include: { service: true },
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
        },
      }),
    ]);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="card">
          <p className="text-[10px] text-gray-500">Bugün</p>
          <p className="text-lg font-bold text-lotus-700">{todayAppointments.length}</p>
        </div>
        <div className="card">
          <p className="text-[10px] text-gray-500">Üye</p>
          <p className="text-lg font-bold text-lotus-700">{memberCount}</p>
        </div>
        <div className="card">
          <p className="text-[10px] text-gray-500">Gelecek</p>
          <p className="text-lg font-bold text-lotus-700">{weekAppointments}</p>
        </div>
      </div>

      {activePromo && (
        <div className="card mt-1.5 border-l-2 border-gold">
          <p className="text-[10px] text-gold-dark">Kampanya</p>
          <p className="font-medium">{activePromo.title}</p>
          <Link href="/admin/kampanyalar" className="text-[10px] text-lotus-600">
            →
          </Link>
        </div>
      )}

      <div className="card mt-1.5">
        <h2>Bugün {today}</h2>
        {todayAppointments.length === 0 ? (
          <p className="text-gray-500">Randevu yok.</p>
        ) : (
          <table className="w-full">
            <tbody>
              {todayAppointments.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="whitespace-nowrap">
                    {a.startTime} {a.service.name}
                  </td>
                  <td className="text-gray-600">{a.name}</td>
                  <td className="text-right text-lotus-600">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
