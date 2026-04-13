import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AgentLogsClient } from "./agent-logs-client";

export default async function AgentLogsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user || !supabase) redirect("/login");

  const { data: assistants } = await supabase
    .from("assistants")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <AgentLogsClient assistants={assistants || []} />;
}
