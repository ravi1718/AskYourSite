import { redirect } from "next/navigation";
import { Headphones } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { InboxClient } from "./InboxClient";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user || !supabase) redirect("/login");

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  // Check plan gate
  const { data: usageData } = await supabase
    .rpc("get_user_usage", { p_user_id: effectiveUserId } as any)
    .single();
  const featureFlags = (usageData as any)?.feature_flags ?? {};
  if (!featureFlags.human_handoff) {
    redirect("/dashboard");
  }

  const db = getSupabaseAdminClient();

  // Fetch initial handoffs server-side for zero-CLS load
  let initialHandoffs: any[] = [];
  if (db) {
    const { data: assistants } = await db
      .from("assistants")
      .select("id, name")
      .eq("user_id", effectiveUserId);

    if (assistants && assistants.length > 0) {
      const assistantIds = assistants.map((a: any) => a.id);
      const assistantNameMap = Object.fromEntries(
        assistants.map((a: any) => [a.id, a.name])
      );

      const { data: handoffs } = await db
        .from("handoff_sessions")
        .select(
          "id, assistant_id, session_id, status, trigger_reason, ai_summary, visitor_name, visitor_email, visitor_sentiment, join_token, created_at"
        )
        .in("assistant_id", assistantIds)
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false })
        .limit(50);

      initialHandoffs = (handoffs ?? [])
        .map((h: any) => ({ ...h, assistantName: assistantNameMap[h.assistant_id] ?? "Unknown" }))
        .sort((a: any, b: any) => {
          if (a.status === "waiting" && b.status !== "waiting") return -1;
          if (b.status === "waiting" && a.status !== "waiting") return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          <p className="text-sm text-slate-400">
            Visitors waiting for human support — click Join to take over the conversation
          </p>
        </div>
      </div>

      <InboxClient initialHandoffs={initialHandoffs} />
    </div>
  );
}
