import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";

// GET /api/integrations/hubspot/connect
// Initiates HubSpot OAuth flow.
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const { data: usage } = await admin.rpc("get_user_usage", { p_user_id: effectiveUserId } as any).single();
  const plan = (usage as any)?.plan_code;
  if (plan !== "pro" && plan !== "business") {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=upgrade_required`);
  }

  if (!process.env.HUBSPOT_CLIENT_ID || !process.env.HUBSPOT_CLIENT_SECRET) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);
  }

  // HMAC CSRF state
  // Use effectiveUserId so the callback stores integration under the workspace owner's account
  const timestamp = Date.now();
  const statePayload = `${effectiveUserId}.${timestamp}`;
  const sig = crypto
    .createHmac("sha256", process.env.HUBSPOT_CLIENT_SECRET)
    .update(statePayload)
    .digest("hex");
  const state = Buffer.from(`${statePayload}.${sig}`).toString("base64url");

  const scopes = ["crm.objects.contacts.read", "crm.objects.companies.read", "content"].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.HUBSPOT_CLIENT_ID,
    redirect_uri: `${appUrl}/api/integrations/hubspot/callback`,
    scope: scopes,
    state,
  });

  return NextResponse.redirect(`https://app.hubspot.com/oauth/authorize?${params.toString()}`);
}
