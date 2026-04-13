import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncNotionConfig } from "@/lib/notion/sync";
import { getWorkspaceContext } from "@/lib/workspace";

// Allow up to 60 seconds — Notion sync is synchronous now (not fire-and-forget)
export const maxDuration = 60;

// POST /api/integrations/notion/sync-now
// Triggers an immediate Notion sync for a specific bot.
// Body: { botId }
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const { botId } = await req.json();
  if (!botId) return NextResponse.json({ error: "botId is required" }, { status: 400 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: config } = await admin
    .from("notion_sync_configs")
    .select("id, user_id")
    .eq("bot_id", botId)
    .eq("user_id", effectiveUserId)
    .single();

  if (!config) {
    return NextResponse.json({ error: "No sync config found for this bot" }, { status: 404 });
  }

  try {
    await syncNotionConfig(config.id);
  } catch (e) {
    console.error("[Notion] sync-now failed for config", config.id, ":", e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Sync complete" });
}
