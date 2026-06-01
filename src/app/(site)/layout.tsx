import { SiteChrome } from "@/components/SiteChrome";

/** Müşteri sayfaları — kısa önbellek, Neon gecikmesini her tıklamada tekrarlatmaz */
export const revalidate = 120;

/** Müşteri sitesi — masaüstü header/footer + mobil alt menü */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteChrome>{children}</SiteChrome>;
}
