import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MobileFab } from "@/components/mobile/MobileFab";
import { MobileFooter } from "@/components/mobile/MobileFooter";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { getSession } from "@/lib/auth";

export async function SiteChrome({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <>
      <div className="site-desktop-only">
        <Header />
      </div>
      <MobileHeader session={session} />

      <main className="site-main flex-1">{children}</main>

      <div className="site-desktop-only">
        <Footer />
      </div>
      <MobileFooter />

      <MobileBottomNav session={session} />
      <MobileFab />
    </>
  );
}
