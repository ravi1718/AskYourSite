import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";

// GET /api/assistants/overrides?assistantId=xxx — list overrides for an assistant
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assistantId = searchParams.get("assistantId");
    if (!assistantId) {
      return NextResponse.json({ error: "Missing assistantId" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await getWorkspaceContext();
    const effectiveUserId = workspace?.effectiveUserId ?? user.id;
    const admin = getSupabaseAdminClient();
    const client = admin ?? supabase;

    // Verify ownership
    const { data: assistant } = await client
      .from("assistants")
      .select("id")
      .eq("id", assistantId)
      .eq("user_id", effectiveUserId)
      .single();
    if (!assistant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data, error } = await client
      .from("response_overrides")
      .select("id, trigger_phrase, override_response, is_active, created_at")
      .eq("assistant_id", assistantId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ overrides: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/assistants/overrides — create a new override
export async function POST(req: Request) {
  try {
    const { assistantId, triggerPhrase, overrideResponse } = await req.json();
    if (!assistantId || !triggerPhrase?.trim() || !overrideResponse?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await getWorkspaceContext();
    const effectiveUserId = workspace?.effectiveUserId ?? user.id;
    const admin = getSupabaseAdminClient();
    const client = admin ?? supabase;

    // Verify ownership
    const { data: assistant } = await client
      .from("assistants")
      .select("id")
      .eq("id", assistantId)
      .eq("user_id", effectiveUserId)
      .single();
    if (!assistant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data, error } = await client
      .from("response_overrides")
      .insert({
        assistant_id: assistantId,
        trigger_phrase: triggerPhrase.trim().toLowerCase(),
        override_response: overrideResponse.trim(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ override: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/assistants/overrides?id=xxx — delete an override
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getSupabaseAdminClient();
    const client = admin ?? supabase;

    const { error } = await client
      .from("response_overrides")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/assistants/overrides?id=xxx — toggle is_active
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const { isActive } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getSupabaseAdminClient();
    const client = admin ?? supabase;

    const { error } = await client
      .from("response_overrides")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
