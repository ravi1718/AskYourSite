"use client";

import { ChatWidget } from "@/components/chat-widget";

export function DocsChatWidget() {
  const assistantId = process.env.NEXT_PUBLIC_AYS_DOCS_ASSISTANT_ID;
  if (!assistantId) return null;
  return <ChatWidget assistantId={assistantId} showBranding={true} />;
}
