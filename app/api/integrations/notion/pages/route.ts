import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";

const NOTION_VERSION = "2022-06-28";

async function searchNotion(accessToken: string, filterType: "page" | "database") {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: { value: filterType, property: "object" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
      page_size: 50,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

function getTitle(obj: any): string {
  // Pages: properties.title or title array; Databases: title array
  try {
    const titleArr =
      obj.properties?.title?.title ??
      obj.title ??
      [];
    return titleArr.map((t: any) => t.plain_text ?? "").join("") || "Untitled";
  } catch {
    return "Untitled";
  }
}

// GET /api/integrations/notion/pages — returns accessible pages + databases
export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: integration } = await admin
    .from("user_integrations")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("provider", "notion")
    .single();

  if (!integration?.access_token) {
    return NextResponse.json({ error: "Notion not connected" }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = decrypt(integration.access_token);
  } catch {
    return NextResponse.json({ error: "Failed to decrypt token" }, { status: 500 });
  }

  const [pageResults, dbResults] = await Promise.all([
    searchNotion(accessToken, "page"),
    searchNotion(accessToken, "database"),
  ]);

  const pages = pageResults.map((p: any) => ({
    id: p.id,
    title: getTitle(p),
    last_edited: p.last_edited_time,
  }));

  const databases = dbResults.map((d: any) => ({
    id: d.id,
    title: getTitle(d),
    last_edited: d.last_edited_time,
  }));

  return NextResponse.json({ pages, databases });
}
