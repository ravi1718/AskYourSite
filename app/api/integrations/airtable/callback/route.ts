import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";

// GET /api/integrations/airtable/callback
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const errorParam = req.nextUrl.searchParams.get("error");

  if (errorParam === "access_denied") {
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
      .createHmac("sha256", process.env.AIRTABLE_CLIENT_SECRET!)
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

  // Retrieve PKCE code verifier from cookie
  const codeVerifier = req.cookies.get("airtable_pkce")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=invalid_state`);
  }

  // Exchange code for tokens (Airtable uses Basic auth for the client credentials)
  const credentials = Buffer.from(
    `${process.env.AIRTABLE_CLIENT_ID!}:${process.env.AIRTABLE_CLIENT_SECRET!}`
  ).toString("base64");

  const tokenRes = await fetch("https://airtable.com/oauth2/v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl}/api/integrations/airtable/callback`,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[Airtable OAuth] Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=token_exchange`);
  }

  const tokens = await tokenRes.json();

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
      provider: "airtable",
      access_token: encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      token_expires_at: expiresAt,
      metadata: {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  // Clear PKCE cookie
  const response = NextResponse.redirect(`${appUrl}/dashboard/integrations?success=airtable`);
  response.cookies.set("airtable_pkce", "", { maxAge: 0, path: "/" });
  return response;
}
