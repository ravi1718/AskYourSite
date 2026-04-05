import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// POST /api/zapier/actions/send-message
// Sends a message to a bot and returns the AI response.
// Uses an internal fetch to /api/chat to reuse all existing RAG + streaming logic.
// Body: { bot_id, message, session_id? }
export async function POST(req: NextRequest) {
  const auth = await verifyApiKey(req);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.bot_id || !body?.message) {
    return NextResponse.json({ error: "bot_id and message are required" }, { status: 400 });
  }

  const { bot_id, message, session_id } = body;
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  // Verify bot belongs to this user
  const { data: bot } = await admin
    .from("assistants")
    .select("id")
    .eq("id", bot_id)
    .eq("user_id", auth.userId)
    .single();

  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  const effectiveSessionId = session_id ?? crypto.randomUUID();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Call the existing /api/chat endpoint internally
  const chatRes = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: message }],
      assistantId: bot_id,
      sessionId: effectiveSessionId,
    }),
  });

  if (!chatRes.ok) {
    return NextResponse.json({ error: "Chat request failed" }, { status: 502 });
  }

  // Read the streamed response and collect text
  const reader = chatRes.body?.getReader();
  if (!reader) return NextResponse.json({ error: "No response body" }, { status: 502 });

  let fullText = "";
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }

  // Strip __AYS_* markers that embed.js strips client-side
  const cleanResponse = fullText.replace(/__AYS_\w+__[\s\S]*/g, "").trim();

  return NextResponse.json({
    response: cleanResponse,
    session_id: effectiveSessionId,
  });
}
