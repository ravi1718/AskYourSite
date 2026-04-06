import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DocsMarkdown } from "./docs-markdown";
import { DOC_SECTIONS } from "@/lib/docs/config";
import type { LoadedDoc } from "@/lib/docs/types";
import type { NavItem } from "@/lib/docs/types";

interface Props {
  doc: LoadedDoc;
  prev: NavItem | null;
  next: NavItem | null;
}

function getSectionTitle(sectionKey: string): string {
  const section = DOC_SECTIONS.find((s) =>
    s.items.some((item) => item.section === sectionKey)
  );
  return section?.title ?? sectionKey;
}

export function DocContent({ doc, prev, next }: Props) {
  const sectionTitle = getSectionTitle(doc.meta.section);

  return (
    <article className="max-w-3xl mx-auto px-6 py-10 pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
        <span>{sectionTitle}</span>
        <span>/</span>
        <span className="text-slate-300">{doc.meta.title}</span>
      </nav>

      {/* Content */}
      <DocsMarkdown content={doc.content} />

      {/* Prev / Next */}
      <div className="mt-12 pt-6 border-t border-[#1A1A1A] flex items-center justify-between gap-4">
        {prev ? (
          <Link
            href={`/docs/${prev.section}/${prev.slug}`}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group max-w-[45%]"
          >
            <ChevronLeft className="h-4 w-4 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            <div className="text-right min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-slate-600 mb-0.5">Previous</div>
              <div className="truncate">{prev.label}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/docs/${next.section}/${next.slug}`}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group max-w-[45%] ml-auto"
          >
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-slate-600 mb-0.5">Next</div>
              <div className="truncate">{next.label}</div>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </article>
  );
}
