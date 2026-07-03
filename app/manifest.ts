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
        src: "/img/logo.jpg",
        sizes: "any",
        type: "image/jpeg",
      },
    ],
  };
}
