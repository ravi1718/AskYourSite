import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getValidToken(
  admin: SupabaseClient,
  userId: string,
  integration: { access_token: string; refresh_token: string | null; token_expires_at: string | null }
): Promise<string> {
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at) : null;
  const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (!needsRefresh || !integration.refresh_token) {
    return integration.access_token;
  }

  const res = await fetch("https://auth.calendly.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: integration.refresh_token,
      client_id: process.env.CALENDLY_CLIENT_ID!,
      client_secret: process.env.CALENDLY_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) return integration.access_token;

  const tokens = await res.json();
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await admin.from("user_integrations").update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? integration.refresh_token,
    token_expires_at: newExpiresAt,
  }).eq("user_id", userId).eq("provider", "calendly");

  return tokens.access_token;
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const { data: integration } = await admin
    .from("user_integrations")
    .select("access_token, refresh_token, token_expires_at, metadata")
    .eq("user_id", effectiveUserId)
    .eq("provider", "calendly")
    .single();

  if (!integration) {
    return NextResponse.json({ error: "Calendly not connected" }, { status: 404 });
  }

  const userUri = integration.metadata?.uri;
  if (!userUri) {
    return NextResponse.json({ error: "Missing Calendly user URI" }, { status: 400 });
  }

  const accessToken = await getValidToken(admin, effectiveUserId, integration);

  const params = new URLSearchParams({ user: userUri, active: "true", count: "20" });
  const res = await fetch(`https://api.calendly.com/event_types?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch event types from Calendly" }, { status: 502 });
  }

  const data = await res.json();
  const eventTypes = (data.collection ?? []).map((et: any) => ({
    uri: et.uri,
    name: et.name,
    scheduling_url: et.scheduling_url,
    duration: et.duration,
  }));

  return NextResponse.json({ eventTypes });
}
