import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";

// GET /api/integrations/google/connect
// Initiates Google OAuth. Requests scopes for Docs, Sheets, and Drive in one flow.
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

  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);
  }

  // HMAC CSRF state: base64url(userId.timestamp.sig)
  // Use effectiveUserId so the callback stores integration under the workspace owner's account
  const timestamp = Date.now();
  const statePayload = `${effectiveUserId}.${timestamp}`;
  const sig = crypto
    .createHmac("sha256", process.env.GOOGLE_OAUTH_CLIENT_SECRET)
    .update(statePayload)
    .digest("hex");
  const state = Buffer.from(`${statePayload}.${sig}`).toString("base64url");

  const scopes = [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: `${appUrl}/api/integrations/google/callback`,
    response_type: "code",
    scope: scopes,
    access_type: "offline",   // request refresh_token
    prompt: "consent",        // always show consent screen so we always get refresh_token
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
