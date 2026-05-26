import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobil önizleme | LOTUS",
  robots: { index: false, follow: false },
};

/** SiteChrome dışı — tam ekran önizleme aracı */
export default function MobilOnizlemeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
