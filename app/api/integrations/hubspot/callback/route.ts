import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";

// GET /api/integrations/hubspot/callback
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const errorParam = req.nextUrl.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=access_denied`);
  }

  if (!state) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=invalid_state`);
  }

  // Verify HMAC state
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
      .createHmac("sha256", process.env.HUBSPOT_CLIENT_SECRET!)
      .update(`${userId}.${tsStr}`)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      throw new Error("State signature invalid");
    }

    stateUserId = userId;
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=no_code`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/integrations/hubspot/callback`,
      code,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[HubSpot OAuth] Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=token_exchange`);
  }

  const tokens = await tokenRes.json();

  // Fetch portal info (hub_id = portal ID)
  let hubId: string | null = null;
  try {
    const infoRes = await fetch("https://api.hubapi.com/oauth/v1/access-tokens/" + tokens.access_token);
    if (infoRes.ok) {
      const info = await infoRes.json();
      hubId = String(info.hub_id ?? "");
    }
  } catch {}

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  await admin.from("user_integrations").upsert(
    {
      user_id: stateUserId,
      provider: "hubspot",
      access_token: encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      token_expires_at: expiresAt,
      metadata: { hub_id: hubId },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=hubspot`);
}
