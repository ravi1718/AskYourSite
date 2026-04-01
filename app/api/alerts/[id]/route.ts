import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // Verify the message belongs to one of the user's assistants
  const { data: message } = await admin
    .from("chat_messages")
    .select("assistant_id, assistants!inner(user_id)")
    .eq("id", id)
    .single();

  if (!message) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ownerUserId = (message as any).assistants?.user_id;
  if (ownerUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await admin.from("chat_messages").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
