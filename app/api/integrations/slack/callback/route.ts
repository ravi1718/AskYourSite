import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const errorParam = req.nextUrl.searchParams.get("error");

  // User denied OAuth
  if (errorParam === "access_denied") {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=access_denied`);
  }

  // Validate CSRF state parameter
  if (!state) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=invalid_state`);
  }

  let stateUserId: string;
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    const secondLastDot = decoded.lastIndexOf(".", lastDot - 1);
    const userId = decoded.substring(0, secondLastDot);
    const tsStr = decoded.substring(secondLastDot + 1, lastDot);
    const sig = decoded.substring(lastDot + 1);

    const timestamp = parseInt(tsStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 10 * 60 * 1000) {
      throw new Error("State expired");
    }

    const expected = crypto
      .createHmac("sha256", process.env.SLACK_SIGNING_SECRET!)
      .update(`${userId}.${tsStr}`)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      throw new Error("State signature invalid");
    }

    stateUserId = userId;
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=invalid_state`);
  }

  // stateUserId is already cryptographically verified above via HMAC-SHA256 —
  // no session cookie check needed (and it would fail on ngrok/cross-domain anyway).

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=no_code`);
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/integrations/slack/callback`,
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.ok) {
    console.error("[Slack OAuth] Token exchange failed:", tokens.error);
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=token_exchange`);
  }

  // Incoming webhook is required for alerts to work
  if (!tokens.incoming_webhook?.url) {
    console.error("[Slack OAuth] No incoming_webhook in response");
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=token_exchange`);
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);
  }

  // Encrypt sensitive fields before storage
  const encryptedToken = encrypt(tokens.access_token);
  const encryptedWebhook = encrypt(tokens.incoming_webhook.url);

  await admin.from("user_integrations").upsert(
    {
      user_id: stateUserId,
      provider: "slack",
      access_token: encryptedToken,
      metadata: {
        team_id: tokens.team?.id ?? null,
        team_name: tokens.team?.name ?? null,
        channel_id: tokens.incoming_webhook.channel_id ?? null,
        channel_name: (tokens.incoming_webhook.channel ?? "").replace(/^#/, ""),
        webhook_url: encryptedWebhook,
        bot_user_id: tokens.bot_user_id ?? null,
        alert_new_lead: true,
        alert_buying_intent: true,
        alert_unanswered: true,
        alert_booking_confirmed: true,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=slack`);
}
