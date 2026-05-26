import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerReviews } from "@/components/CustomerReviews";
import { MobilePageTitle } from "@/components/mobile/MobilePageTitle";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findActiveStaffBySlug } from "@/lib/staff-content-scope";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const staff = await findActiveStaffBySlug(slug);
  if (!staff) return { title: "Yorumlar | LOTUS" };
  return {
    title: `${staff.label} — Yorumlar | LOTUS Güzellik Salonu`,
    description: `${staff.label} hakkında müşteri yorumları.`,
  };
}

export default async function StaffYorumlarPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const staff = await findActiveStaffBySlug(slug);
  if (!staff) notFound();

  const session = await getSession();
  const isMember = session?.role === "MEMBER";

  const rows = await prisma.customerReview.findMany({
    where: { status: "APPROVED", staffProfileId: staff.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      imageUrls: true,
      createdAt: true,
      user: { select: { name: true } },
      guestName: true,
    },
  });

  const initialReviews = rows.map((r) => ({
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
      <MobilePageTitle title={`${staff.label} — Yorumlar`} />

      <section className="site-desktop-only relative overflow-hidden bg-gradient-to-br from-lotus-800 via-lotus-700 to-lotus-600 px-4 py-12 text-center text-white md:py-16">
        <div className="hero-pattern absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-lotus-center">
            Usta yorumları
          </p>
          <h1 className="font-display mt-3 text-4xl font-light md:text-5xl">
            {staff.label}
          </h1>
          <p className="mt-4 text-rose-100/90">Müşteri yorumları</p>
          <p className="mt-4">
            <Link
              href="/yorumlar"
              className="text-sm text-rose-100 underline hover:text-white"
            >
              ← Tüm ustalar
            </Link>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 md:py-16 lg:px-8">
        <CustomerReviews
          initialReviews={initialReviews}
          member={member}
          staffSlug={staff.slug}
          staffLabel={staff.label}
        />
      </div>
    </div>
  );
}
