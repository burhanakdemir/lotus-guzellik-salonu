import { SettingsAdmin } from "@/components/admin/SettingsAdmin";
import { prisma } from "@/lib/prisma";
import { isMultiAdminEnabled } from "@/lib/staff-admin";

export default async function AdminAyarlarPage() {
  const settings = await prisma.salonSettings.findUnique({
    where: { id: "default" },
  });
  const closedDays = await prisma.closedDay.findMany({ orderBy: { date: "asc" } });

  if (!settings) return <p>Ayarlar yüklenemedi.</p>;

  return (
    <div>
      <h1>Ayarlar</h1>
      <SettingsAdmin
        settings={settings}
        closedDays={closedDays}
        multiAdminEnabled={isMultiAdminEnabled()}
      />
    </div>
  );
}
