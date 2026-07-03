import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone-сборка для лёгкого Docker-образа
  output: "standalone",
};

export default nextConfig;
