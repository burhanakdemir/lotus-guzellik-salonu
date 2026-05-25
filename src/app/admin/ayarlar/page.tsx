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

  let adminTotp: { enabled: boolean; enabledAt: string | null } | null = null;
  if (session?.role === "ADMIN") {
    try {
      const adminUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: { totpEnabledAt: true },
      });
      adminTotp = {
        enabled: Boolean(adminUser?.totpEnabledAt),
        enabledAt: adminUser?.totpEnabledAt?.toISOString() ?? null,
      };
    } catch {
      adminTotp = { enabled: false, enabledAt: null };
    }
  }

  if (!settings) return <p>Ayarlar yüklenemedi.</p>;

  return (
    <div className="space-y-6">
      <h1>Ayarlar</h1>
      {adminTotp && (
        <AdminTotpSettings
          initialEnabled={adminTotp.enabled}
          enabledAt={adminTotp.enabledAt}
        />
      )}
      <SettingsAdmin
        settings={settings}
        closedDays={closedDays}
        multiAdminEnabled={isMultiAdminEnabled()}
        showcase={{
          showcaseImage1: settings.showcaseImage1,
          showcaseImage2: settings.showcaseImage2,
          showcaseImage3: settings.showcaseImage3,
          showcaseImage4: settings.showcaseImage4,
        }}
      />
    </div>
  );
}
