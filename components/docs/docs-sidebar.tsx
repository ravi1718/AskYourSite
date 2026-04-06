"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOC_SECTIONS } from "@/lib/docs/config";
import { DocsSidebarItem } from "./docs-sidebar-item";

interface DocsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocsSidebar({ isOpen, onClose }: DocsSidebarProps) {
  const pathname = usePathname();

  // Determine which section contains the active page so it's open by default
  const activeSection = DOC_SECTIONS.find((s) =>
    s.items.some((item) => pathname === `/docs/${item.section}/${item.slug}`)
  )?.title;

  return (
    <aside
      className={cn(
        "flex-shrink-0 w-72 flex flex-col border-r border-[#1A1A1A] bg-[#0D0D0D]",
        // Desktop: sticky in flow
        "md:sticky md:top-0 md:h-screen md:translate-x-0 md:overflow-y-auto",
        // Mobile: fixed overlay
        "fixed inset-y-0 left-0 z-40 h-full overflow-y-auto",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A] sticky top-0 bg-[#0D0D0D] z-10">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="AskYourSite" width={28} height={28} className="rounded-md" />
          <div>
            <div className="text-sm font-semibold text-white font-display leading-tight">AskYourSite</div>
            <div className="text-[10px] text-slate-500 leading-tight">Documentation</div>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {DOC_SECTIONS.map((section) => (
          <DocsSidebarItem
            key={section.title}
            section={section}
            pathname={pathname}
            defaultOpen={section.defaultOpen || section.title === activeSection}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1A1A1A]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
