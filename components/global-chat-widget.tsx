"use client";

import { usePathname } from "next/navigation";
import { ChatWidget } from "./chat-widget";

export function GlobalChatWidget({ assistantId }: { assistantId?: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/docs")) return null;
  return <ChatWidget assistantId={assistantId} />;
}
