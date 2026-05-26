import { redirect } from "next/navigation";

/** Eski personel sayfası → randevular + personel sekmesi */
export default async function StaffPersonelRandevularRedirect(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  redirect(`/admin/randevular?personel=${encodeURIComponent(slug)}`);
}
