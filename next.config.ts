import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tamamen statik çıktı: Vercel, Netlify, kendi sunucun ya da bir klasör — hepsi çalışır.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
