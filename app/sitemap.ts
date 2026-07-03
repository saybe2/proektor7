import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/rooms", "/menu", "/karaoke", "/games", "/bonus"];
  return pages.map((p) => ({
    url: `${SITE.URL}${p}`,
    lastModified: new Date(),
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.8,
  }));
}
