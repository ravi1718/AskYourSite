import { MetadataRoute } from "next";
import { ALL_DOC_ITEMS } from "@/lib/docs/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://askyoursite.in";

  const docUrls: MetadataRoute.Sitemap = ALL_DOC_ITEMS.map((item) => ({
    url: `${base}/docs/${item.section}/${item.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...docUrls,
    {
      url: `${base}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
