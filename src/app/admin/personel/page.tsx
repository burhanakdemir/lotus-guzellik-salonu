import { redirect } from "next/navigation";

/** Eski personel URL → randevular sayfasında sekme */
export default function AdminPersonelRedirectPage() {
  redirect("/admin/randevular");
}
