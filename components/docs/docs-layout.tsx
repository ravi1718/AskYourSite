"use client";

import { useState } from "react";
import { DocsSidebar } from "./docs-sidebar";
import { DocsMobileHeader } from "./docs-mobile-header";
import { DocsChatWidget } from "./docs-chat-widget";

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-[#F8FAFC]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <DocsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <DocsMobileHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <DocsChatWidget />
    </div>
  );
}
