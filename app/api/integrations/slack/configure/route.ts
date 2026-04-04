import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Plan gate
  const { data: usage } = await admin.rpc("get_user_usage", { p_user_id: user.id } as any).single();
  const plan = (usage as any)?.plan_code;
  if (plan !== "pro" && plan !== "business") {
    return NextResponse.json({ error: "Slack integration requires Pro plan or above" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const {
    alert_new_lead,
    alert_buying_intent,
    alert_unanswered,
    alert_booking_confirmed,
  } = body;

  // Fetch existing metadata to merge (preserve webhook_url, team info, etc.)
  const { data: integration } = await admin
    .from("user_integrations")
    .select("metadata")
    .eq("user_id", user.id)
    .eq("provider", "slack")
    .single();

  if (!integration) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
  }

  const updatedMeta = {
    ...(integration.metadata ?? {}),
    alert_new_lead: Boolean(alert_new_lead),
    alert_buying_intent: Boolean(alert_buying_intent),
    alert_unanswered: Boolean(alert_unanswered),
    alert_booking_confirmed: Boolean(alert_booking_confirmed),
  };

  const { error } = await admin
    .from("user_integrations")
    .update({ metadata: updatedMeta, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("provider", "slack");

  if (error) {
    console.error("[Slack] Configure update failed:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
