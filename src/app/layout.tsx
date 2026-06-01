import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LOTUS Bayankuaförü & Güzellik Salonu | Antalya Kepez",
  description:
    "Antalya Kepez'de premium kuaför ve güzellik hizmetleri. Online randevu, saç, cilt, makyaj, gelin paketi ve daha fazlası.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "LOTUS",
    statusBarStyle: "default",
  },
  icons: {
    apple: [{ url: "/logo/lotus-sade.png", sizes: "180x180", type: "image/png" }],
    icon: [
      { url: "/logo/lotus-sade.png", sizes: "192x192", type: "image/png" },
      { url: "/logo/lotus-sade.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#c25b7d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">{children}</body>
    </html>
  );
}
