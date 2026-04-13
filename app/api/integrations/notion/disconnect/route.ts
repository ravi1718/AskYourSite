import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";

export async function POST() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  // Deactivate all notion sync configs for this user
  await admin
    .from("notion_sync_configs")
    .update({ status: "inactive" })
    .eq("user_id", effectiveUserId);

  // Delete the integration record
  await admin
    .from("user_integrations")
    .delete()
    .eq("user_id", effectiveUserId)
    .eq("provider", "notion");

  return NextResponse.json({ ok: true });
}
