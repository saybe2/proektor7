import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone-сборка для лёгкого Docker-образа
  output: "standalone",

  async headers() {
    return [
      {
        // картинки (у загрузок случайные имена, длинный кэш безопасен)
        source: "/img/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
