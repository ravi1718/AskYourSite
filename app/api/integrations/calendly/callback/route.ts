import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=no_code`);
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.redirect(`${appUrl}/login`);

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://auth.calendly.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl}/api/integrations/calendly/callback`,
      client_id: process.env.CALENDLY_CLIENT_ID!,
      client_secret: process.env.CALENDLY_CLIENT_SECRET!,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=token_exchange`);
  }

  const tokens = await tokenRes.json();

  // Fetch Calendly user profile
  const meRes = await fetch("https://api.calendly.com/users/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const me = meRes.ok ? await meRes.json() : {};

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=token_exchange`);
  }

  await admin.from("user_integrations").upsert(
    {
      user_id: user.id,
      provider: "calendly",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      metadata: {
        uri: me.resource?.uri ?? tokens.owner ?? null,
        organization: tokens.organization ?? null,
        name: me.resource?.name ?? null,
        email: me.resource?.email ?? null,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=calendly`);
}
