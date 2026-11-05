import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const altYol = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Geliştirme sunucusuna aynı ağdaki telefondan girilebilsin diye.
 * Next, başka bir kaynaktan gelen /_next isteklerini varsayılan olarak
 * engelliyor; engellenince sayfanın JavaScript'i hiç inmiyor ve ekranda
 * yalnızca sunucudan gelen statik kısım kalıyor.
 *
 * Yalnızca bu makinenin kendi yerel adresleri izinli; yayına etkisi yok.
 */
const yerelAdresler = Object.values(networkInterfaces())
  .flat()
  .filter((arayuz) => arayuz && arayuz.family === "IPv4" && !arayuz.internal)
  .map((arayuz) => arayuz!.address);

const nextConfig: NextConfig = {
  output: "export",
  basePath: altYol,
  images: { unoptimized: true },
  trailingSlash: true,
  // three.js eklentileri derlenmemiş kod gönderdiği için gerekli
  transpilePackages: ["three"],
  allowedDevOrigins: yerelAdresler,
};

export default nextConfig;
