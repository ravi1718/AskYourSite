import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import AlertsList from "./alerts-list";

const UNANSWERED_PATTERNS = [
  "i don't have",
  "i don't know",
  "no specific context",
  "i'm not sure",
  "i cannot find",
  "not available in",
  "no information",
];

async function getAllAlerts(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data: assistants } = await supabase
    .from("assistants")
    .select("id, name")
    .eq("user_id", userId);

  if (!assistants || assistants.length === 0) return [];

  const assistantIds = assistants.map((a) => a.id);
  const assistantMap = Object.fromEntries(assistants.map((a) => [a.id, a.name]));

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, content, assistant_id, created_at")
    .in("assistant_id", assistantIds)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(1000);

  return (messages || [])
    .filter((msg) =>
      UNANSWERED_PATTERNS.some((p) => msg.content.toLowerCase().includes(p))
    )
    .map((msg) => ({
      id: msg.id,
      message: msg.content,
      assistantName: assistantMap[msg.assistant_id] ?? "Unknown",
      assistantId: msg.assistant_id,
      date: msg.created_at,
    }));
}

export default async function AlertsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!supabase || !user) redirect("/login");

  const alerts = await getAllAlerts(user.id);

  return (
    <div className="mx-auto max-w-4xl w-full animate-fade-up">
      <header className="flex items-center gap-4 py-6 border-b border-border mb-8">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-display font-semibold text-white tracking-tight">Unanswered Queries</h1>
          <p className="mt-1 text-sm text-slate-400">
            Queries your assistant couldn't answer — add content to your knowledge base to fix these.
          </p>
        </div>
        {alerts.length > 0 && (
          <span className="bg-ember/10 text-ember text-sm px-3 py-1 rounded-full border border-ember/20 font-medium">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      <AlertsList initialAlerts={alerts} />
    </div>
  );
}
