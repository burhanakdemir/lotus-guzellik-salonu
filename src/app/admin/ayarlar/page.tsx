import { SettingsAdmin } from "@/components/admin/SettingsAdmin";
import { AdminTotpSettings } from "@/components/admin/AdminTotpSettings";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMultiAdminEnabled } from "@/lib/staff-admin";

export default async function AdminAyarlarPage() {
  const session = await getSession();
  const settings = await prisma.salonSettings.findUnique({
    where: { id: "default" },
  });
  const closedDays = await prisma.closedDay.findMany({ orderBy: { date: "asc" } });

  const adminUser =
    session?.role === "ADMIN"
      ? await prisma.user.findUnique({
          where: { id: session.id },
          select: { totpEnabledAt: true },
        })
      : null;

  if (!settings) return <p>Ayarlar yüklenemedi.</p>;

  return (
    <div className="space-y-6">
      <h1>Ayarlar</h1>
      {adminUser && (
        <AdminTotpSettings
          initialEnabled={Boolean(adminUser.totpEnabledAt)}
          enabledAt={adminUser.totpEnabledAt?.toISOString() ?? null}
        />
      )}
      <SettingsAdmin
        settings={settings}
        closedDays={closedDays}
        multiAdminEnabled={isMultiAdminEnabled()}
      />
    </div>
  );
}
