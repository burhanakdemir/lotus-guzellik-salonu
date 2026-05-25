import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /** Yerel JPG/SVG — optimizer bozuk dosyada 500/null hatası vermesin */
    unoptimized: true,
    remotePatterns: [],
  },
};

export default nextConfig;
