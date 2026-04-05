import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// POST /api/integrations/notion/sync-config
// Saves which Notion pages/databases should sync to a bot.
// Body: { botId, selectedPages, selectedDatabases, notionEnabled, syncFrequency? }
export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId, selectedPages = [], selectedDatabases = [], notionEnabled = true, syncFrequency = "daily" } = await req.json();

  if (!botId) return NextResponse.json({ error: "botId is required" }, { status: 400 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  // Verify bot ownership
  const { data: bot } = await admin
    .from("assistants")
    .select("id, user_id, widget_config")
    .eq("id", botId)
    .single();

  if (!bot || bot.user_id !== user.id) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  // Get the user's Notion integration ID
  const { data: integration } = await admin
    .from("user_integrations")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", "notion")
    .single();

  // Save sync config
  await admin.from("notion_sync_configs").upsert(
    {
      bot_id: botId,
      user_id: user.id,
      notion_integration_id: integration?.id ?? null,
      selected_pages: selectedPages,
      selected_databases: selectedDatabases,
      sync_frequency: syncFrequency,
      next_sync_at: new Date().toISOString(),
      status: "active",
    },
    { onConflict: "bot_id" }
  );

  // Also save notionEnabled to widget_config
  const updatedConfig = { ...(bot.widget_config ?? {}), notionEnabled: Boolean(notionEnabled) };
  await admin
    .from("assistants")
    .update({ widget_config: updatedConfig, updated_at: new Date().toISOString() })
    .eq("id", botId);

  return NextResponse.json({ ok: true });
}
