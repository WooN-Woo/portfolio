import type { NextConfig } from "next";

/**
 * Site bir alt klasörde yayınlanıyorsa (GitHub Pages gibi) bu değer dolu olur.
 * Kendi alan adında kökte yayınlanırken boş kalır.
 */
const altYol = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Tamamen statik çıktı: Cloudflare, GitHub Pages, kendi sunucun — hepsi çalışır.
  output: "export",
  basePath: altYol,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
