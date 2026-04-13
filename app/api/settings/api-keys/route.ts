import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateApiKey } from "@/lib/api-key-auth";
import { getWorkspaceContext } from "@/lib/workspace";

// GET — list this user's API keys (prefix + metadata, never the full key)
export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const { data, error } = await admin
    .from("api_keys")
    .select("id, key_prefix, label, last_used_at, created_at, is_active")
    .eq("user_id", effectiveUserId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data ?? [] });
}

// POST — generate a new API key (key is returned ONCE, only hash stored)
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const body = await req.json().catch(() => ({}));
  const label: string = (body.label as string)?.trim() || "Default Key";

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Limit to 5 active keys per user
  const { count } = await admin
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", effectiveUserId)
    .eq("is_active", true);

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "You can have at most 5 active API keys. Revoke an existing key first." },
      { status: 409 }
    );
  }

  const { key, hash, prefix } = generateApiKey();

  const { error } = await admin.from("api_keys").insert({
    user_id: effectiveUserId,
    key_hash: hash,
    key_prefix: prefix,
    label,
    is_active: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return the full key ONCE — it won't be retrievable again
  return NextResponse.json({ key, prefix, label });
}

// DELETE — revoke a key by ID
export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const { error } = await admin
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", effectiveUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
