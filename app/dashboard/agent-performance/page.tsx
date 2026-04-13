import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { AgentPerformanceClient } from "./agent-performance-client";

export default async function AgentPerformancePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user || !supabase) redirect("/login");

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  const admin = getSupabaseAdminClient();
  const { data: assistants } = admin
    ? await admin.from("assistants").select("id, name").eq("user_id", effectiveUserId).order("created_at", { ascending: false })
    : await supabase.from("assistants").select("id, name").eq("user_id", effectiveUserId).order("created_at", { ascending: false });

  return <AgentPerformanceClient assistants={assistants || []} />;
}
