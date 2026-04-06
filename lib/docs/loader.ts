import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { DocMeta, LoadedDoc } from "./types";
import { ALL_DOC_ITEMS } from "./config";

export async function loadDoc(section: string, slug: string): Promise<LoadedDoc | null> {
  const filePath = path.join(process.cwd(), "content/docs", section, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    meta: {
      title: data.title ?? slug,
      description: data.description ?? "",
      section,
      slug,
      badge: data.badge,
    },
    content,
  };
}

export function getPrevNext(section: string, slug: string) {
  const idx = ALL_DOC_ITEMS.findIndex(
    (item) => item.section === section && item.slug === slug
  );
  return {
    prev: idx > 0 ? ALL_DOC_ITEMS[idx - 1] : null,
    next: idx < ALL_DOC_ITEMS.length - 1 ? ALL_DOC_ITEMS[idx + 1] : null,
  };
}
