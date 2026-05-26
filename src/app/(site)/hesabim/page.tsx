import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { HesabimPanel } from "@/components/HesabimPanel";
import { MemberNotificationsPanel } from "@/components/MemberNotificationsPanel";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { WeeklyPromotions } from "@/components/WeeklyPromotions";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { LogoutButton } from "@/components/LogoutButton";
import { MobilePageTitle } from "@/components/mobile/MobilePageTitle";

export default async function HesabimPage() {
  const session = await getSession();
  if (!session || session.role !== "MEMBER") {
    if (session?.role === "ADMIN") redirect("/admin");
    redirect("/giris");
  }

  const now = new Date();
  const [member, appointments, discounts, promotions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: { email: true },
    }),
    prisma.appointment.findMany({
      where: { userId: session.id },
      include: { service: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.memberDiscount.findMany({
      where: {
        userId: session.id,
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: { services: { include: { service: true } } },
    }),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { services: { include: { service: true } } },
      orderBy: { startDate: "desc" },
      take: 3,
    }),
  ]);

  const statusLabels: Record<string, string> = {
    PENDING: "Beklemede",
    CONFIRMED: "Onaylandı",
    CANCELLED: "İptal",
    COMPLETED: "Tamamlandı",
  };

  const memberEmail = member?.email ?? session.email ?? null;

  return (
    <HesabimPanel initialEmail={memberEmail}>
      <MobilePageTitle title="Hesabım" backHref="/" />
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-rose-900">Hesabım</h1>
            <p className="text-gray-600">
              {session.name} · {session.phone}
            </p>
            {memberEmail && (
              <p className="text-sm text-gray-500">{memberEmail}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <ChangePasswordModal />
            <LogoutButton className="btn-gold !py-2.5 !px-6 !text-xs">
              Üye Çıkış
            </LogoutButton>
          </div>
        </div>

      {promotions.length > 0 && (
        <section className="card mt-8 overflow-hidden !p-0">
          <div className="relative overflow-hidden bg-gradient-to-br from-lotus-700 via-lotus-800 to-lotus-900 text-lotus-100">
            <div className="hero-pattern absolute inset-0 opacity-30" />
            <div className="relative px-6 py-5">
              <h2 className="font-display text-xl font-semibold text-white md:text-2xl">
                Haftanın Kampanyaları
              </h2>
              <p className="mt-1 text-sm text-lotus-100/90">
                Bu hafta geçerli salon kampanyaları
              </p>
            </div>
          </div>
          <div className="px-4 py-5 md:px-5">
            <WeeklyPromotions promotions={promotions} variant="panel" />
          </div>
        </section>
      )}

      {discounts.length > 0 && (
        <section className="card mt-8">
          <h2 className="font-semibold text-rose-900">Aktif İndirimleriniz</h2>
          <ul className="mt-4 space-y-3">
            {discounts.map((d) => (
              <li key={d.id} className="rounded-lg bg-rose-50 p-4 text-sm">
                <strong>{d.title}</strong>
                <p className="text-rose-700">
                  {d.discountType === "PERCENT"
                    ? `%${d.discountValue}`
                    : formatPrice(d.discountValue)}
                  {d.singleUse && " · Tek kullanımlık"}
                </p>
                <p className="text-gray-500">
                  {d.startDate.toLocaleDateString("tr-TR")} –{" "}
                  {d.endDate.toLocaleDateString("tr-TR")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-rose-900">Randevu Geçmişi</h2>
          <Link href="/randevu" className="text-sm text-rose-600 hover:underline">
            Yeni randevu
          </Link>
        </div>
        {appointments.length === 0 ? (
          <p className="mt-4 text-gray-500">Henüz randevunuz yok.</p>
        ) : (
          <ul className="mt-4 divide-y divide-rose-100">
            {appointments.map((a) => (
              <li key={a.id} className="py-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{a.service.name}</span>
                  <span className="text-rose-600">{statusLabels[a.status]}</span>
                </div>
                <p className="text-gray-600">
                  {a.date} · {a.startTime} – {a.endTime}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PushNotificationPrompt />
      <MemberNotificationsPanel />
      </div>
    </HesabimPanel>
  );
}
