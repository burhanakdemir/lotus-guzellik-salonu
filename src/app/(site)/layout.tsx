import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

/** Müşteri sitesi — üst menü ve alt bilgi */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
