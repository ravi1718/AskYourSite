import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { decrypt } from "@/lib/crypto";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Plan gate (use workspace owner's plan)
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const { data: usage } = await admin.rpc("get_user_usage", { p_user_id: effectiveUserId } as any).single();
  const plan = (usage as any)?.plan_code;
  if (plan !== "pro" && plan !== "business") {
    return NextResponse.json({ error: "Slack integration requires Pro plan or above" }, { status: 403 });
  }

  // Fetch integration (from workspace owner's account)
  const { data: integration } = await admin
    .from("user_integrations")
    .select("access_token")
    .eq("user_id", effectiveUserId)
    .eq("provider", "slack")
    .single();

  if (!integration?.access_token) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
  }

  let token: string;
  try {
    token = decrypt(integration.access_token);
  } catch {
    return NextResponse.json({ error: "Failed to read integration" }, { status: 500 });
  }

  // Fetch channels from Slack API
  const res = await fetch(
    "https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=200",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await res.json();

  if (!data.ok) {
    console.error("[Slack] conversations.list failed:", data.error);
    return NextResponse.json({ error: "Failed to fetch channels", slackError: data.error }, { status: 502 });
  }

  const channels = (data.channels ?? [])
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      is_private: c.is_private ?? false,
      num_members: c.num_members ?? 0,
    }))
    .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

  return NextResponse.json({ channels });
}
