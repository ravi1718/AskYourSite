import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const assistantId = formData.get("assistantId") as string | null;
    const userId = formData.get("userId") as string | null;

    if (!file || !assistantId || !userId) {
      return NextResponse.json({ error: "Missing file, assistantId, or userId" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Admin client not initialized" }, { status: 500 });
    }

    // Verify ownership
    const { data: assistant } = await supabase
      .from("assistants")
      .select("id")
      .eq("id", assistantId)
      .eq("user_id", userId)
      .single();

    if (!assistant) {
      return NextResponse.json({ error: "Assistant not found or access denied" }, { status: 404 });
    }

    // Get file extension
    const ext = file.name.split(".").pop() || "png";
    const storagePath = `${userId}/${assistantId}/logo.${ext}`;

    // Convert File to ArrayBuffer then to Uint8Array for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Ensure the bucket exists and is public (fails gracefully if it already exists)
    await supabase.storage.createBucket("widget-assets", { public: true }).catch(() => {});

    // Upload to Supabase Storage (upsert to overwrite existing logo)
    const { error: uploadError } = await supabase.storage
      .from("widget-assets")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Upload Logo] Storage error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("widget-assets")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Update the assistant's widget_config with the new logo URL
    const { data: currentAssistant } = await supabase
      .from("assistants")
      .select("widget_config")
      .eq("id", assistantId)
      .single();

    const currentConfig = currentAssistant?.widget_config || {};
    const updatedConfig = { ...currentConfig, logoUrl: publicUrl };

    await supabase
      .from("assistants")
      .update({ widget_config: updatedConfig })
      .eq("id", assistantId);

    return NextResponse.json({ success: true, logoUrl: publicUrl });
  } catch (error: any) {
    console.error("[Upload Logo] Fatal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
