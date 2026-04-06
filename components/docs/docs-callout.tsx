import { cn } from "@/lib/utils";
import React from "react";

const VARIANTS = {
  Note: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    label: "text-blue-400",
    icon: "ℹ",
  },
  Warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    label: "text-amber-400",
    icon: "⚠",
  },
  Tip: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    label: "text-emerald-400",
    icon: "✦",
  },
  Important: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    label: "text-violet-400",
    icon: "★",
  },
};

type VariantKey = keyof typeof VARIANTS;

/** Recursively extract plain text from React children without JSON.stringify */
function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return "";
}

export function DocsCallout({ children }: { children: React.ReactNode }) {
  const text = extractText(children);

  let variant: VariantKey = "Note";
  for (const key of Object.keys(VARIANTS) as VariantKey[]) {
    if (text.startsWith(key) || text.includes(`**${key}**`) || text.includes(`${key}:`)) {
      variant = key;
      break;
    }
  }

  const v = VARIANTS[variant];

  return (
    <div
      className={cn(
        "my-5 flex gap-3 rounded-xl border px-4 py-3.5",
        v.border,
        v.bg
      )}
    >
      <span className={cn("mt-0.5 text-base flex-shrink-0", v.label)}>{v.icon}</span>
      <div className="text-sm text-slate-300 leading-relaxed [&_p]:mb-0 [&_strong]:font-semibold [&_strong]:text-white">
        {children}
      </div>
    </div>
  );
}
