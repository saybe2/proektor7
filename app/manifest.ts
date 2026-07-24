import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.NAME,
    short_name: SITE.SHORT_NAME,
    description: SITE.DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2222b2",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48 64x64",
        type: "image/x-icon",
      },
      {
        src: "/img/logo.jpg",
        sizes: "any",
        type: "image/jpeg",
      },
    ],
  };
}
