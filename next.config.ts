import type { NextConfig } from "next";

const altYol = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: altYol,
  images: { unoptimized: true },
  trailingSlash: true,
  // three.js eklentileri derlenmemiş kod gönderdiği için gerekli
  transpilePackages: ["three"],
};

export default nextConfig;
