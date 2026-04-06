import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// POST /api/integrations/google/disconnect
// Deletes Google integration and deactivates all Google sync configs for this user.
export async function POST() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  // Deactivate all Google sync configs
  await Promise.all([
    admin.from("google_docs_sync_configs").update({ status: "inactive" }).eq("user_id", user.id),
    admin.from("google_sheets_sync_configs").update({ status: "inactive" }).eq("user_id", user.id),
    admin.from("google_drive_sync_configs").update({ status: "inactive" }).eq("user_id", user.id),
  ]);

  // Delete integration record
  await admin
    .from("user_integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "google");

  return NextResponse.json({ ok: true });
}
