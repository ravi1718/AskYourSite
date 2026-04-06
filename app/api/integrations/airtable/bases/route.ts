import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidAccessToken } from "@/lib/integrations/token";

// GET /api/integrations/airtable/bases
// Lists all Airtable bases and their tables accessible to the user.
export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: integration } = await admin
    .from("user_integrations")
    .select("id, user_id, provider, access_token, refresh_token, token_expires_at, metadata")
    .eq("user_id", user.id)
    .eq("provider", "airtable")
    .single();

  if (!integration) return NextResponse.json({ resources: [] });

  try {
    const accessToken = await getValidAccessToken(integration as any);

    // List all bases
    const basesRes = await fetch("https://api.airtable.com/v0/meta/bases", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!basesRes.ok) {
      console.error("[Airtable] List bases failed:", await basesRes.text());
      return NextResponse.json({ resources: [] });
    }

    const basesData = await basesRes.json();
    const bases: { id: string; name: string }[] = basesData.bases ?? [];

    // For each base, list tables and return them as resources
    const resources: { id: string; title: string; subtitle?: string }[] = [];

    await Promise.allSettled(
      bases.map(async (base) => {
        try {
          const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${base.id}/tables`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!tablesRes.ok) return;
          const tablesData = await tablesRes.json();
          for (const table of tablesData.tables ?? []) {
            resources.push({
              id: `${base.id}::${table.id}`,  // composite key: baseId::tableId
              title: table.name,
              subtitle: base.name,
            });
          }
        } catch {}
      })
    );

    return NextResponse.json({ resources });
  } catch (err) {
    console.error("[Airtable] Error:", err);
    return NextResponse.json({ resources: [] });
  }
}
