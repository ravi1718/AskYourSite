import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Auth check
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Plan gate: Pro or Business only (use workspace owner's plan)
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const { data: usage } = await admin.rpc("get_user_usage", { p_user_id: effectiveUserId } as any).single();
  const plan = (usage as any)?.plan_code;
  if (plan !== "pro" && plan !== "business") {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=upgrade_required`);
  }

  if (!process.env.SLACK_CLIENT_ID || !process.env.SLACK_SIGNING_SECRET) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);
  }

  // Build CSRF state: base64url( userId . timestamp . hmac(userId.timestamp) )
  // Use effectiveUserId so the callback stores integration under the workspace owner's account
  const timestamp = Date.now();
  const statePayload = `${effectiveUserId}.${timestamp}`;
  const sig = crypto
    .createHmac("sha256", process.env.SLACK_SIGNING_SECRET)
    .update(statePayload)
    .digest("hex");
  const state = Buffer.from(`${statePayload}.${sig}`).toString("base64url");

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID,
    scope: "incoming-webhook,channels:read,groups:read,chat:write,chat:write.public",
    redirect_uri: `${appUrl}/api/integrations/slack/callback`,
    state,
  });

  return NextResponse.redirect(`https://slack.com/oauth/v2/authorize?${params.toString()}`);
}
