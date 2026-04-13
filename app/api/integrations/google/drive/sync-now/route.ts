import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncGoogleDriveConfig } from "@/lib/google/sync-drive";
import { getWorkspaceContext } from "@/lib/workspace";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const { botId } = await req.json();
  if (!botId) return NextResponse.json({ error: "botId required" }, { status: 400 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: config } = await admin
    .from("google_drive_sync_configs")
    .select("id")
    .eq("bot_id", botId)
    .eq("user_id", effectiveUserId)
    .single();

  if (!config) return NextResponse.json({ error: "No sync config found" }, { status: 404 });

  try {
    await syncGoogleDriveConfig(config.id);
  } catch (e) {
    console.error("[Google Drive] sync-now failed:", e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Sync complete" });
}
