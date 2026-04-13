import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AgentPerformanceClient } from "./agent-performance-client";

export default async function AgentPerformancePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user || !supabase) redirect("/login");

  const { data: assistants } = await supabase
    .from("assistants")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <AgentPerformanceClient assistants={assistants || []} />;
}
