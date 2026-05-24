import { redirect } from "next/navigation";

/** Eski personel sayfası → randevular + personel sekmesi */
export default async function StaffPersonelRandevularRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/admin/randevular?personel=${encodeURIComponent(slug)}`);
}
