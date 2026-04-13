import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { decrypt } from "@/lib/crypto";
import { testBlock } from "@/lib/slack/blocks";

export async function POST() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  // Plan gate (use workspace owner's plan)
  const { data: usage } = await admin.rpc("get_user_usage", { p_user_id: effectiveUserId } as any).single();
  const plan = (usage as any)?.plan_code;
  if (plan !== "pro" && plan !== "business") {
    return NextResponse.json({ error: "Slack integration requires Pro plan or above" }, { status: 403 });
  }

  // Fetch integration (from workspace owner's account)
  const { data: integration } = await admin
    .from("user_integrations")
    .select("metadata")
    .eq("user_id", effectiveUserId)
    .eq("provider", "slack")
    .single();

  if (!integration?.metadata?.webhook_url) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
  }

  const meta = integration.metadata as Record<string, any>;

  let webhookUrl: string;
  try {
    webhookUrl = decrypt(meta.webhook_url);
  } catch {
    return NextResponse.json({ success: false, error: "Failed to read integration" }, { status: 500 });
  }

  // Build list of enabled alerts for the test message
  const enabledAlerts: string[] = [];
  if (meta.alert_new_lead) enabledAlerts.push("New leads");
  if (meta.alert_buying_intent) enabledAlerts.push("Buying intent");
  if (meta.alert_unanswered) enabledAlerts.push("Unanswered questions");
  if (meta.alert_booking_confirmed) enabledAlerts.push("Booking confirmed");

  // Fetch workspace owner's first assistant name for the test message
  const { data: firstAssistant } = await admin
    .from("assistants")
    .select("name")
    .eq("user_id", effectiveUserId)
    .order("created_at")
    .limit(1)
    .single();

  const botName = firstAssistant?.name ?? "Your assistant";
  const blocks = testBlock(botName, enabledAlerts);

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[Slack] Test notification failed:", res.status, text);
    return NextResponse.json({ success: false, error: "Failed to send. Try reconnecting Slack." });
  }

  return NextResponse.json({ success: true });
}
