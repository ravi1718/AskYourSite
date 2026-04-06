"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { DocsCodeBlock } from "./docs-code-block";
import { DocsCallout } from "./docs-callout";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1
      className="font-display text-3xl font-bold text-white mt-0 mb-6 leading-tight tracking-tight"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, id, ...props }) => (
    <h2
      id={id}
      className="font-display text-xl font-semibold text-white mt-10 mb-4 scroll-mt-20 pb-2 border-b border-[#1A1A1A]"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, id, ...props }) => (
    <h3
      id={id}
      className="font-display text-lg font-semibold text-white mt-7 mb-3 scroll-mt-20"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="font-display text-base font-semibold text-slate-200 mt-5 mb-2"
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-slate-300 leading-7 mb-4 text-[15px]">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 ml-5 space-y-1.5 list-disc marker:text-blue-500 text-slate-300 text-[15px]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 ml-5 space-y-1.5 list-decimal marker:text-blue-500 marker:font-semibold text-slate-300 text-[15px]">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-7 pl-1">{children}</li>
  ),
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    if (match) {
      // children are already highlighted React spans from rehype-highlight
      return (
        <DocsCodeBlock language={match[1]}>
          {children}
        </DocsCodeBlock>
      );
    }
    return (
      <code
        className="bg-[#111111] border border-[#1A1A1A] rounded px-1.5 py-0.5 text-sm font-mono text-blue-300"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-[#1A1A1A]">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#111111] border-b border-[#1A1A1A]">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-[#1A1A1A] last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 font-semibold text-white text-[13px]">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-slate-300 text-[13px]">{children}</td>
  ),
  a: ({ href, children }) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-blue-400 underline decoration-blue-400/40 underline-offset-2 hover:text-blue-300 hover:decoration-blue-300/60 transition-colors"
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => <DocsCallout>{children}</DocsCallout>,
  hr: () => <hr className="my-8 border-[#1A1A1A]" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
};

export function DocsMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, rehypeSlug]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
