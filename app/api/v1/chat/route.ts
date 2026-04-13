import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/v1/chat
 *
 * Server-to-server relay endpoint. Authenticated via API key
 * (Authorization: Bearer ask_live_xxx). Accepts the same request body
 * as the public /api/chat endpoint and streams back the same response
 * format so the embed.js widget can pipe it directly.
 *
 * Designed for the "Webhook Relay" install pattern:
 *   Browser widget  →  User's relay server  →  /api/v1/chat  →  AI
 *
 * The user's relay keeps their API key secret and handles any
 * server-side logging, filtering, or augmentation they need.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  // 1. Verify API key
  const auth = await verifyApiKey(req);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid API key via Authorization: Bearer ask_live_xxx" },
      { status: 401 }
    );
  }

  // 2. Parse and validate request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { assistantId } = body as { assistantId?: string };
  if (!assistantId) {
    return NextResponse.json({ error: "assistantId is required" }, { status: 400 });
  }

  // 3. Verify the assistant belongs to this API key's user (security check)
  const admin = getSupabaseAdminClient();
  if (admin) {
    const { data: assistant } = await admin
      .from("assistants")
      .select("id")
      .eq("id", assistantId)
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found or does not belong to your account" },
        { status: 404 }
      );
    }
  }

  // 4. Proxy the request to the internal /api/chat endpoint
  //    This streams back the exact same response format the widget expects,
  //    including __AYS_SUGGESTIONS__, __AYS_ACTIONS__, etc.
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  let chatResponse: Response;
  try {
    chatResponse = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[v1/chat] Failed to reach /api/chat:", err);
    return NextResponse.json({ error: "Internal relay error" }, { status: 502 });
  }

  if (!chatResponse.ok && !chatResponse.body) {
    return NextResponse.json(
      { error: "Upstream chat service error" },
      { status: chatResponse.status }
    );
  }

  // 5. Stream the response straight back to the caller
  return new NextResponse(chatResponse.body, {
    status: chatResponse.status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    },
  });
}
