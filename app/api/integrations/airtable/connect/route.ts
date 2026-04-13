import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";

// GET /api/integrations/airtable/connect
// Initiates Airtable OAuth 2.0 (PKCE) flow.
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

  if (!process.env.AIRTABLE_CLIENT_ID || !process.env.AIRTABLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);
  }

  // HMAC CSRF state
  // Use effectiveUserId so the callback stores integration under the workspace owner's account
  const timestamp = Date.now();
  const statePayload = `${effectiveUserId}.${timestamp}`;
  const sig = crypto
    .createHmac("sha256", process.env.AIRTABLE_CLIENT_SECRET)
    .update(statePayload)
    .digest("hex");
  const state = Buffer.from(`${statePayload}.${sig}`).toString("base64url");

  // PKCE code verifier + challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  // Store code_verifier in a short-lived cookie (expires in 10 min)
  const response = NextResponse.redirect(
    `https://airtable.com/oauth2/v1/authorize?` +
    new URLSearchParams({
      client_id: process.env.AIRTABLE_CLIENT_ID,
      redirect_uri: `${appUrl}/api/integrations/airtable/callback`,
      response_type: "code",
      scope: "data.records:read schema.bases:read",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }).toString()
  );

  response.cookies.set("airtable_pkce", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
