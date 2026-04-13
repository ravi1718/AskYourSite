import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateApiKey } from "@/lib/api-key-auth";
import { getWorkspaceContext } from "@/lib/workspace";

// GET /api/keys — list user's API keys (no hashes, no full keys)
export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data, error } = await admin
    .from("api_keys")
    .select("id, label, key_prefix, created_at, last_used_at, is_active")
    .eq("user_id", effectiveUserId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ keys: data ?? [] });
}

// POST /api/keys — generate a new API key (returns full key ONCE)
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const body = await req.json().catch(() => ({}));
  const label = (body.label as string | undefined)?.trim().slice(0, 100) || "Default Key";

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { key, hash, prefix } = generateApiKey();

  const { data, error } = await admin
    .from("api_keys")
    .insert({ user_id: effectiveUserId, key_hash: hash, key_prefix: prefix, label })
    .select("id, label, key_prefix, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return the full key ONCE — it is never stored or retrievable again
  return NextResponse.json({ key, ...data }, { status: 201 });
}
