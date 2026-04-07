import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const assistantId = searchParams.get("assistantId");

    if (!sessionId || !assistantId) {
      return NextResponse.json(
        { error: "Missing sessionId or assistantId" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("session_id", sessionId)
      .eq("assistant_id", assistantId)
      .order("created_at", { ascending: true })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    return NextResponse.json(
      { messages: data ?? [] },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
