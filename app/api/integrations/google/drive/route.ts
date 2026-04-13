import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidAccessToken } from "@/lib/integrations/token";
import { getWorkspaceContext } from "@/lib/workspace";

// GET /api/integrations/google/drive
// Lists all Drive folders accessible to the user (top-level + shared drives).
export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: integration } = await admin
    .from("user_integrations")
    .select("id, user_id, provider, access_token, refresh_token, token_expires_at, metadata")
    .eq("user_id", effectiveUserId)
    .eq("provider", "google")
    .single();

  if (!integration) return NextResponse.json({ resources: [] });

  try {
    const accessToken = await getValidAccessToken(integration as any);

    // List folders (not trashed)
    const params = new URLSearchParams({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id,name,parents)",
      orderBy: "name",
      pageSize: "100",
    });

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error("[Google Drive] List failed:", await res.text());
      return NextResponse.json({ resources: [] });
    }

    const data = await res.json();
    const resources = (data.files ?? []).map((f: any) => ({
      id: f.id,
      title: f.name,
    }));

    return NextResponse.json({ resources });
  } catch (err) {
    console.error("[Google Drive] Error:", err);
    return NextResponse.json({ resources: [] });
  }
}
