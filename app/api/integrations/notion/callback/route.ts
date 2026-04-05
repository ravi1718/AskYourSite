import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";

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

  // Verify HMAC state (same pattern as Slack callback)
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
      .createHmac("sha256", process.env.NOTION_CLIENT_SECRET!)
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

  // Exchange code for access token using Basic auth (Notion's requirement)
  const credentials = Buffer.from(
    `${process.env.NOTION_CLIENT_ID!}:${process.env.NOTION_CLIENT_SECRET!}`
  ).toString("base64");

  const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl}/api/integrations/notion/callback`,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[Notion OAuth] Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=token_exchange`);
  }

  const tokens = await tokenRes.json();
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=server_error`);
  }

  await admin.from("user_integrations").upsert(
    {
      user_id: stateUserId,
      provider: "notion",
      access_token: encrypt(tokens.access_token),
      metadata: {
        workspace_id: tokens.workspace_id ?? null,
        workspace_name: tokens.workspace_name ?? null,
        bot_id_notion: tokens.bot_id ?? null,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=notion`);
}
