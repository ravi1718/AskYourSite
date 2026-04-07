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

    const widgetConfig = assistant.widget_config || {};

    // Return the config merged with server-enforced feature flags
    return NextResponse.json({
      ...widgetConfig,
      name: assistant.name,
      // show_branding: false only if plan allows it AND the owner toggled it off
      show_branding: !(featureFlags.remove_branding && widgetConfig.removeBranding === true),
      // lead_capture_enabled: true only if plan allows it AND the owner toggled it on
      lead_capture_enabled: !!(featureFlags.lead_capture && widgetConfig.leadCaptureEnabled === true),
      image_search_enabled: featureFlags.image_search,
      // Agent config fields (null if not configured)
      checkout_url: widgetConfig.checkoutUrl ?? null,
      order_tracking_url: widgetConfig.orderTrackingUrl ?? null,
      support_url: widgetConfig.supportUrl ?? null,
      order_webhook_url: widgetConfig.orderWebhookUrl ?? null,
      // Exit capture
      exit_capture_enabled: !!(widgetConfig.exitCaptureEnabled === true),
      exit_capture_message: widgetConfig.exitCaptureMessage ?? "Before you go — can I help you with anything else?",
      // Notification bubbles
      notification_enabled: !!(widgetConfig.notificationEnabled === true),
      notification_messages: [widgetConfig.notificationMessage1, widgetConfig.notificationMessage2].filter(Boolean),
      notification_delay: widgetConfig.notificationDelay ?? 4,
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
