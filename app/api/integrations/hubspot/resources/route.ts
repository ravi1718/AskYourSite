import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidAccessToken } from "@/lib/integrations/token";
import { getWorkspaceContext } from "@/lib/workspace";

// GET /api/integrations/hubspot/resources
// Returns available content sources: Knowledge Base categories + Blog.
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
    .eq("provider", "hubspot")
    .single();

  if (!integration) return NextResponse.json({ resources: [] });

  try {
    const accessToken = await getValidAccessToken(integration as any);
    const resources: { id: string; title: string; subtitle?: string }[] = [];

    // Add a fixed "Knowledge Base" source (we'll fetch all articles during sync)
    resources.push({ id: "hubspot::kb", title: "Knowledge Base", subtitle: "All published articles" });

    // Add a fixed "Blog Posts" source
    resources.push({ id: "hubspot::blog", title: "Blog Posts", subtitle: "All published blog posts" });

    // Try to fetch blog names for better labels
    try {
      const blogsRes = await fetch(
        "https://api.hubapi.com/cms/v3/blogs?limit=10&state=PUBLISHED",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (blogsRes.ok) {
        const blogsData = await blogsRes.json();
        const blogs: { id: string; name: string }[] = blogsData.results ?? [];
        if (blogs.length > 1) {
          // Replace generic "Blog Posts" with individual blogs
          const idx = resources.findIndex((r) => r.id === "hubspot::blog");
          if (idx !== -1) resources.splice(idx, 1);
          for (const blog of blogs) {
            resources.push({ id: `hubspot::blog::${blog.id}`, title: blog.name, subtitle: "Blog" });
          }
        }
      }
    } catch {}

    return NextResponse.json({ resources });
  } catch (err) {
    console.error("[HubSpot] Error fetching resources:", err);
    return NextResponse.json({ resources: [] });
  }
}
