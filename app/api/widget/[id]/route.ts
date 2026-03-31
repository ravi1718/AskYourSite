import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assistantId } = await params;

    if (!assistantId) {
      return NextResponse.json({ error: "Missing assistant ID" }, { 
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase client initialization failed" }, { 
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
    }

    // Fetch the assistant's specific widget configuration + owner
    const { data: assistant, error } = await supabase
      .from("assistants")
      .select("name, widget_config, user_id")
      .eq("id", assistantId)
      .single();

    if (error || !assistant) {
      return NextResponse.json({ error: "Assistant configuration not found" }, {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    // Fetch owner plan to enforce feature flags
    let featureFlags: Record<string, boolean> = {
      image_search: false,
      lead_capture: false,
      remove_branding: false,
    };
    if (assistant.user_id) {
      const { data: usageData } = await supabase
        .rpc("get_user_usage", { p_user_id: assistant.user_id } as any)
        .single();
      const flags = (usageData as any)?.feature_flags;
      if (flags) featureFlags = { ...featureFlags, ...flags };
    }

    // Return the config merged with server-enforced feature flags
    return NextResponse.json({
      ...(assistant.widget_config || {}),
      name: assistant.name,
      // Server-enforced: widget reads these and respects them
      show_branding: !featureFlags.remove_branding,
      lead_capture_enabled: featureFlags.lead_capture,
      image_search_enabled: featureFlags.image_search,
    }, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error: any) {
    console.error("[WidgetConfig] API Error:", error);
    return NextResponse.json({ error: error.message }, { 
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}
