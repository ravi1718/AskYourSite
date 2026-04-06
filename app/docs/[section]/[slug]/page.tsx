import { loadDoc, getPrevNext } from "@/lib/docs/loader";
import { ALL_DOC_ITEMS } from "@/lib/docs/config";
import { DocContent } from "@/components/docs/docs-content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ section: string; slug: string }>;
}

export async function generateStaticParams() {
  return ALL_DOC_ITEMS.map((item) => ({
    section: item.section,
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section, slug } = await params;
  const doc = await loadDoc(section, slug);
  if (!doc) return {};
  return {
    title: doc.meta.title,
    description: doc.meta.description,
  };
}

export default async function DocPage({ params }: Props) {
  const { section, slug } = await params;
  const doc = await loadDoc(section, slug);
  if (!doc) notFound();

  const { prev, next } = getPrevNext(section, slug);

  return <DocContent doc={doc} prev={prev} next={next} />;
}
