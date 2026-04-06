"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

interface Props {
  onOpenSidebar: () => void;
}

export function DocsMobileHeader({ onOpenSidebar }: Props) {
  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#1A1A1A] bg-[#0D0D0D] sticky top-0 z-20">
      <button
        onClick={onOpenSidebar}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="AskYourSite" width={24} height={24} className="rounded-md" />
        <span className="text-sm font-semibold text-white font-display">AskYourSite Docs</span>
      </Link>
    </header>
  );
}
