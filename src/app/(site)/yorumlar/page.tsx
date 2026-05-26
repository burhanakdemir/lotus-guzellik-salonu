import { CustomerReviews } from "@/components/CustomerReviews";
import { MobilePageTitle } from "@/components/mobile/MobilePageTitle";
import { StaffPublicPicker } from "@/components/public/StaffPublicPicker";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadActiveStaffForPublic } from "@/lib/staff-content-scope";

export const metadata = {
  title: "Sizden Gelen Yorumlar | LOTUS Güzellik Salonu",
  description: "Müşterilerimizin deneyimleri ve yorumları.",
};

export default async function YorumlarPage() {
  const session = await getSession();
  const isMember = session?.role === "MEMBER";

  const [staff, legacyRows] = await Promise.all([
    loadActiveStaffForPublic(),
    prisma.customerReview.findMany({
      where: { status: "APPROVED", staffProfileId: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        content: true,
        imageUrls: true,
        createdAt: true,
        user: { select: { name: true } },
        guestName: true,
      },
    }),
  ]);

  const legacyReviews = legacyRows.map((r) => ({
    id: r.id,
    content: r.content,
    imageUrls: r.imageUrls,
    createdAt: r.createdAt.toISOString(),
    authorName: r.user?.name ?? r.guestName ?? "Misafir",
  }));

  const member = isMember
    ? { isMember: true as const, name: session!.name }
    : { isMember: false as const };

  return (
    <div>
      <MobilePageTitle title="Yorumlar" />

      <section className="site-desktop-only relative overflow-hidden bg-gradient-to-br from-lotus-800 via-lotus-700 to-lotus-600 px-4 py-12 text-center text-white md:py-16">
        <div className="hero-pattern absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-lotus-center">
            Deneyimleriniz
          </p>
          <h1 className="font-display mt-3 text-4xl font-light md:text-5xl">
            Sizden Gelen Yorumlar
          </h1>
          <p className="mt-4 text-rose-100/90">
            Ustanızı seçerek yorum bırakın veya okuyun
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 md:py-16 lg:px-8">
        <StaffPublicPicker staff={staff} basePath="/yorumlar" title="Usta yorumları" />

        {legacyReviews.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display mb-4 text-center text-2xl text-lotus-800">
              Genel yorumlar
            </h2>
            <CustomerReviews initialReviews={legacyReviews} member={member} />
          </section>
        )}

        {staff.length === 0 && legacyReviews.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            Henüz yorum yok.{" "}
            {staff.length > 0 ? (
              "Bir usta seçerek yorum bırakabilirsiniz."
            ) : null}
          </p>
        )}

        {staff.length > 0 && legacyReviews.length === 0 && (
          <p className="mt-6 text-center text-sm text-gray-600">
            Yorum bırakmak için yukarıdan bir usta seçin.
          </p>
        )}
      </div>
    </div>
  );
}
