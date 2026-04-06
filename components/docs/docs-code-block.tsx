"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import React from "react";

/** Recursively extract plain text from React children (highlighted spans etc.) */
function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

export function DocsCodeBlock({
  language,
  children,
}: {
  language: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const raw = extractText(children).replace(/\n$/, "");
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-5 rounded-xl border border-[#1A1A1A] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111111] border-b border-[#1A1A1A]">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      {/* Render highlighted children directly — rehype-highlight already processed them */}
      <pre className="overflow-x-auto p-4 bg-[#0D0D0D] text-sm leading-relaxed m-0 rounded-none">
        <code className={`language-${language}`}>{children}</code>
      </pre>
    </div>
  );
}
