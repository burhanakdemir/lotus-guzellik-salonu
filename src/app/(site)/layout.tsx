import { SiteChrome } from "@/components/SiteChrome";

/** Müşteri sitesi — masaüstü header/footer + mobil alt menü */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteChrome>{children}</SiteChrome>;
}
