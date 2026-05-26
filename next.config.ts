import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /** TOTP / QR — canlıda Internal Server Error önleme */
  serverExternalPackages: ["otplib", "qrcode"],
  images: {
    /** Yerel JPG/SVG — optimizer bozuk dosyada 500/null hatası vermesin */
    unoptimized: true,
    remotePatterns: [],
  },
};

export default nextConfig;
