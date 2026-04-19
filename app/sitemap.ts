import { MetadataRoute } from "next";
import { ALL_DOC_ITEMS } from "@/lib/docs/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://askyoursite.in";
  const now = new Date("2026-04-19");

  const docUrls: MetadataRoute.Sitemap = ALL_DOC_ITEMS.map((item) => ({
    url: `${base}/docs/${item.section}/${item.slug}`,
    lastModified: now,
  }));

  return [
    { url: base,                      lastModified: now },
    { url: `${base}/setup`,           lastModified: now },
    { url: `${base}/contact`,         lastModified: new Date("2026-04-01") },
    { url: `${base}/docs`,            lastModified: now },
    ...docUrls,
    { url: `${base}/privacy`,         lastModified: new Date("2026-01-01") },
    { url: `${base}/terms`,           lastModified: new Date("2026-01-01") },
  ];
}
