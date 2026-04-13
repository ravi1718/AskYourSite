import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);

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

  if (!process.env.NOTION_CLIENT_ID || !process.env.NOTION_CLIENT_SECRET) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);
  }

  // Build CSRF state: base64url( userId . timestamp . hmac(userId.timestamp) )
  // Use effectiveUserId so the callback stores integration under the workspace owner's account
  const timestamp = Date.now();
  const statePayload = `${effectiveUserId}.${timestamp}`;
  const sig = crypto
    .createHmac("sha256", process.env.NOTION_CLIENT_SECRET)
    .update(statePayload)
    .digest("hex");
  const state = Buffer.from(`${statePayload}.${sig}`).toString("base64url");

  const params = new URLSearchParams({
    client_id: process.env.NOTION_CLIENT_ID,
    response_type: "code",
    owner: "user",
    redirect_uri: `${appUrl}/api/integrations/notion/callback`,
    state,
  });

  return NextResponse.redirect(`https://api.notion.com/v1/oauth/authorize?${params.toString()}`);
}
